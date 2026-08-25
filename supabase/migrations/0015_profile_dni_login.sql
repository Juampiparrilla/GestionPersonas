-- ============================================================================
-- 0015: permite que roles sin fila en `individuals` (administrador de
-- organizacion, administrador de plataforma) tambien inicien sesion por DNI,
-- igual que los dirigentes -- pedido de Juampi despues de probar la
-- creacion de organizaciones.
--
-- No se reutiliza `individuals` para esto: esa tabla es especificamente la
-- identidad de la jerarquia dirigente->puntero->persona (con su logica de
-- reutilizar filas al reasignar posicion), y un administrador de
-- organizacion no forma parte de esa jerarquia. Se agrega una columna
-- separada en `profiles`, unica GLOBALMENTE (no por organizacion) cuando
-- esta cargada: a diferencia de los dirigentes, los administradores los crea
-- unicamente el Administrador de Plataforma (bajo volumen, curado), asi que
-- no vale la pena reproducir la ambiguedad "mismo DNI en dos organizaciones"
-- que ya existe para el login de dirigentes.
-- ============================================================================

alter table profiles add column dni_normalized text;

create unique index uq_profiles_dni on profiles (dni_normalized) where dni_normalized is not null;
