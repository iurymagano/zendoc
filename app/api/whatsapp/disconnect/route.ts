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

  if (professional.zapi_instance_id) {
    try {
      await disconnectInstance(
        professional.zapi_instance_id,
        professional.zapi_token ?? '',
      );
    } catch (err) {
      console.error(
        'Erro ao desconectar Evolution (continuando com limpeza local):',
        err,
      );
    }
  }

  // Instância foi removida no servidor — zera as credenciais para que o
  // próximo "Conectar" provisione uma nova.
  await supabase
    .from('professionals')
    .update({
      whatsapp_connected: false,
      zapi_instance_id: null,
      zapi_token: null,
    })
    .eq('id', professional.id);

  return NextResponse.json({ ok: true });
}
