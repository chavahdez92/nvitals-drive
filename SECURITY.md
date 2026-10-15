# Política de seguridad

## Versiones con soporte

Solo la última versión publicada recibe correcciones de seguridad.

## Cómo reportar una vulnerabilidad

**No abras un issue público.** Usa el reporte privado de GitHub: pestaña **Security** → **Report a vulnerability** en este repositorio.

Incluye:
- versión de la app y sistema operativo;
- pasos para reproducirla y el impacto que crees que tiene;
- si es posible, una prueba de concepto mínima.

Respuesta esperada: acuse en 7 días y un plan de corrección en 30 días. Te daremos crédito en el aviso publicado, salvo que prefieras lo contrario.

## Alcance

Nos interesan especialmente:
- **Procesos con privilegios:** el helper de escaneo (`--hdi-scan`), que se ejecuta como root tras pedir la contraseña, y cualquier proceso elevado futuro (broker de Linux, helper de Windows).
- **Allowlist de smartctl:** cualquier forma de ejecutar una operación que no esté en la lista cerrada, de inyectar argumentos o de apuntar a un dispositivo no validado.
- **Escritura en discos:** cualquier forma de que la app escriba fuera del archivo temporal del benchmark o de la carpeta de expedientes.
- **Interfaz:** XSS o ejecución de código en el WebView que pueda llegar a los comandos del núcleo.

Fuera de alcance: vulnerabilidades de smartmontools o fio (repórtalas a sus proyectos), y ataques que requieren que la persona ya tenga privilegios de administrador.
