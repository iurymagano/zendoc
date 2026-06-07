import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { getConnectionStatus, getQRCode } from '@/lib/zapi/client';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, zapi_instance_id, zapi_token, whatsapp_connected')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  // Sem instância criada ainda — a tela oferece o botão "Conectar" que
  // provisiona via POST /api/whatsapp/connect (self-service).
  if (!professional.zapi_instance_id) {
    return NextResponse.json({
      provisioned: false,
      connected: false,
      qrcode: null,
    });
  }

  try {
    const { connected } = await getConnectionStatus(
      professional.zapi_instance_id,
      professional.zapi_token ?? '',
    );

    if (connected !== professional.whatsapp_connected) {
      await supabase
        .from('professionals')
        .update({ whatsapp_connected: connected })
        .eq('id', professional.id);
    }

    const qrcode = connected
      ? null
      : await getQRCode(
          professional.zapi_instance_id,
          professional.zapi_token ?? '',
        );

    return NextResponse.json({
      provisioned: true,
      connected,
      qrcode,
    });
  } catch (err) {
    console.error('Erro ao consultar status (Evolution):', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
