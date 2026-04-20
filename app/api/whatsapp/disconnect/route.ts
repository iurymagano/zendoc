import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { disconnectInstance } from '@/lib/zapi/client';

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

  if (professional.zapi_instance_id && professional.zapi_token) {
    try {
      await disconnectInstance(
        professional.zapi_instance_id,
        professional.zapi_token,
      );
    } catch (err) {
      console.error('Erro ao desconectar Z-API (continuando com limpeza local):', err);
    }
  }

  await supabase
    .from('professionals')
    .update({ whatsapp_connected: false })
    .eq('id', professional.id);

  return NextResponse.json({ ok: true });
}
