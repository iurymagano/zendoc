import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { getQRCode } from '@/lib/zapi/client';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, zapi_instance_id, zapi_token')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  if (!professional.zapi_instance_id || !professional.zapi_token) {
    return NextResponse.json(
      {
        error:
          'Instância do WhatsApp ainda não foi provisionada. Entre em contato com o suporte.',
      },
      { status: 400 },
    );
  }

  try {
    const qrcode = await getQRCode(
      professional.zapi_instance_id,
      professional.zapi_token,
    );
    return NextResponse.json({ qrcode });
  } catch (err) {
    console.error('Erro ao buscar QR Code Z-API:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
