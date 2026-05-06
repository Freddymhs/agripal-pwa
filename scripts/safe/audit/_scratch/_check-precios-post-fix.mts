import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data, error } = await sb.from('precios_actual')
  .select('cultivo_id, region, nombre_odepa, precio_actual_clp, precio_min_clp, precio_max_clp, fuente')
  .order('fuente', { ascending: false })
  .order('nombre_odepa');

if (error) { console.error(error); process.exit(1); }
console.log('nombre_odepa             | min    | actual | max    | fuente');
console.log('─'.repeat(70));
for (const r of data ?? []) {
  const flag = (r.precio_actual_clp ?? 0) > 15000 ? '  ⚠️ ALTO?' 
             : (r.precio_actual_clp ?? 0) < 200 && r.nombre_odepa ? '  ⚠️ BAJO?' 
             : '';
  const nombre = (r.nombre_odepa ?? '(sin match ODEPA)').padEnd(25);
  const min    = String(r.precio_min_clp ?? '-').padEnd(7);
  const actual = String(r.precio_actual_clp ?? '-').padEnd(7);
  const max    = String(r.precio_max_clp ?? '-').padEnd(7);
  console.log(`${nombre}| ${min}| ${actual}| ${max}| ${r.fuente}${flag}`);
}
console.log(`\nTotal: ${data?.length} cultivos`);
