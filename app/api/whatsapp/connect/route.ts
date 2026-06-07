import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { createInstance, getQRCode } from '@/lib/zapi/client';

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

  try {
    // Já tem instância → só busca o QR atual.
    if (professional.zapi_instance_id) {
      const qrcode = await getQRCode(
        professional.zapi_instance_id,
        professional.zapi_token ?? '',
      );
      return NextResponse.json({ qrcode });
    }

    // Self-service: cria a instância na Evolution na hora.
    const instanceName = `iazen_${professional.id}`;
    const result = await createInstance(instanceName);

    await supabase
      .from('professionals')
      .update({
        zapi_instance_id: result.instanceName,
        zapi_token: result.apiKey,
      })
      .eq('id', professional.id);

    // O QR pode não vir no create; busca pelo connect como garantia.
    const qrcode =
      result.qrcode ??
      (await getQRCode(result.instanceName, result.apiKey ?? ''));

    return NextResponse.json({ qrcode });
  } catch (err) {
    console.error('Erro ao conectar WhatsApp (Evolution):', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
