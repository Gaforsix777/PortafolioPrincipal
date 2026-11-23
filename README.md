# Portafolio de Ramiro Laime Miranda

Portafolio full stack desarrollado con **React + Vite**, **Express** y **SQLite**. Conserva los proyectos, imágenes y enlaces del portafolio original. Los proyectos se consultan desde la base de datos y el formulario guarda contactos de forma privada. No envía correos automáticamente ni ofrece un listado público de contactos.

## Cumplimiento de la consigna

| Requisito | Implementación |
| --- | --- |
| Push a `dev` | GitHub Actions ejecuta pruebas unitarias, integración y E2E, compilación y validación de infraestructura. |
| Frontend, backend y BD | React, Express, SQLite persistente en volumen Docker. |
| Al menos 3 pruebas de cada tipo | 4 unitarias, 6 de integración y 4 E2E. |
| Push a `main` | Ejecuta todas las comprobaciones, construye y prueba la imagen, la publica en Docker Hub y despliega. |
| Dockerfile y Compose | Build multietapa, usuario sin privilegios, healthcheck, volumen persistente y proxy Caddy. |
| Terraform | VCN, Internet Gateway, rutas, subred pública y privada, reglas de red, VM Ubuntu 24.04 e IP pública. |
| Configuración de VM | Ansible instala Git, Docker Engine, Compose, UFW e iptables. Abre 80/443 y restringe SSH en OCI al runner y al administrador opcional. |
| Puntos extra Ansible | Playbook completo y configuración declarativa. |
| Puntos extra Cloudflare | Túnel administrado con dominio propio o Quick Tunnel con URL temporal `trycloudflare.com`. |

La consigna menciona «vnc»: se interpreta como **VCN**, la red virtual de Oracle Cloud. Si se exige escritorio remoto VNC, es un requisito distinto y no está instalado.

## Desarrollo local

Requiere Node.js 22.13 o posterior; se recomienda Node.js 24 LTS.

```bash
npm ci
npm run dev
```

Frontend: `http://127.0.0.1:5173`. API: `http://127.0.0.1:3000`. Vite redirige `/api` a Express.

```bash
npm run test:unit
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run check` ejecuta la comprobación completa una vez instalado el navegador. Las pruebas E2E levantan el build de producción con una BD aislada en memoria en el puerto 3100. Las pruebas de integración usan archivos SQLite temporales reales y comprueban persistencia al reabrir la BD.

## Docker

```bash
docker compose up -d --build
```

Abrir `http://localhost`. Para detener: `docker compose down`. Los mensajes permanecen en el volumen `portfolio-data`; `down -v` elimina los datos. El servidor Express no publica el puerto 3000 al host; únicamente Caddy publica 80 y 443.

`SITE_ADDRESS=:80` permite demostración por IP mediante HTTP. Para HTTPS, establecer un dominio real en `SITE_ADDRESS` y apuntar su registro DNS a la IP de la VM. Caddy obtiene y renueva el certificado automáticamente. Abrir 443 no produce un certificado válido para una IP por sí solo.

## GitHub Actions

Workflow: `.github/workflows/pipeline.yml`.

```text
push dev / pull_request ── pruebas (4 + 6 + 4) y validación de infraestructura
push main              ── pruebas + validación
                          → build Docker → smoke test → Docker Hub
                          → Terraform plan/apply → Ansible → health público
```

La publicación usa el SHA del commit y `latest`; la VM consume el **digest inmutable** devuelto por Docker Hub. Los despliegues de la misma rama se serializan; un nuevo push no interrumpe un `terraform apply`. `workflow_dispatch` permite repetir una ejecución desde la interfaz de GitHub.

### Secretos requeridos

Configurar en **Settings → Secrets and variables → Actions → Secrets**. Los secretos OCI/SSH también pueden estar en el environment `production`. `DOCKERHUB_TOKEN` debe ser un secreto del repositorio porque el job de publicación no usa ese environment.

| Nombre | Valor |
| --- | --- |
| `DOCKERHUB_TOKEN` | Token de Docker Hub con lectura y escritura para el repositorio público `portafolio`. |
| `OCI_TENANCY_OCID` | OCID de la tenancy. |
| `OCI_USER_OCID` | OCID del usuario autorizado de OCI. |
| `OCI_FINGERPRINT` | Huella de la clave API registrada. |
| `OCI_PRIVATE_KEY` | PEM privado completo de la clave API correspondiente. |
| `OCI_COMPARTMENT_OCID` | Compartimento de los recursos; puede ser la tenancy raíz si tiene permisos. |
| `SSH_PRIVATE_KEY` | Clave SSH privada **sin contraseña**, exclusiva de este despliegue. El pipeline deriva su clave pública. No confundir con la clave API de OCI. |
| `CLOUDFLARE_TUNNEL_TOKEN` | Opcional: token de un túnel administrado. |

No guardar PEM, tokens, `.env`, tfvars reales ni estados en Git. Si una clave privada se comparte en un chat o se publica, reemplazarla y revocar la anterior antes de utilizarla en producción.

### Variables del repositorio

| Nombre | Valor / predeterminado |
| --- | --- |
| `DOCKERHUB_USERNAME` | Obligatorio: usuario de Docker Hub. La imagen se publica como `usuario/portafolio`. |
| `OCI_REGION` | `sa-saopaulo-1`. |
| `TF_STATE_BUCKET` | `portfolio-terraform-state`. Debe reservarse para este proyecto. |
| `SITE_ADDRESS` | `:80`, o un hostname como `portfolio.ejemplo.com`. Sin protocolo ni ruta. |
| `ADMIN_SSH_CIDR` | Opcional: IP pública del administrador seguida de `/32`. |
| `ENABLE_DEMO_TUNNEL` | `true` para una URL HTTPS temporal de Cloudflare sin dominio propio. Predeterminado: `false`. |

Crear el repositorio **público** `portafolio` en Docker Hub. La VM descarga la imagen públicamente; el token de escritura se usa únicamente en GitHub Actions. Un repositorio privado requiere configurar autenticación adicional en la VM.

### Permisos y primer despliegue

El usuario OCI requiere permisos para consultar dominios e imágenes y administrar instancias, volúmenes, redes virtuales y el bucket de estado dentro del compartimento elegido. Un administrador de OCI debe ajustar las políticas al alcance necesario.

El primer despliegue crea un bucket **privado y versionado** mediante el SDK de OCI y después inicializa el backend nativo `oci`. Este backend proporciona bloqueo del estado; no se usan artifacts o cachés de GitHub como almacenamiento del estado. El bucket se conserva independiente de los recursos gestionados por `infra/`.

Terraform selecciona una imagen **Canonical Ubuntu 24.04** compatible con `VM.Standard.E2.1.Micro`. No reutiliza una subred de otro proyecto. Esta forma puede formar parte de Always Free según la cuenta, límites y disponibilidad; revisar cuotas y costos antes de aplicar. Si no hay capacidad, no cambia automáticamente a una forma de pago. El disco raíz es de 50 GB. Una actualización del catálogo de imágenes no reemplaza automáticamente la VM existente.

El pipeline registra la clave SSH de host con `ssh-keyscan` en la primera conexión (TOFU). Para requisitos de alta seguridad, verificar la huella mediante un canal independiente de OCI antes del primer despliegue. No se deshabilita `StrictHostKeyChecking` en Ansible.

Para activar las dos ramas después de configurar cuentas y secretos:

```bash
git push -u origin dev
git switch main
git merge --ff-only dev
git push origin main
```

### Terraform local

Configurar `~/.oci/config` con la clave API de OCI y `region`, `user`, `tenancy`, `fingerprint`, `key_file`. Copiar los ejemplos de `infra/terraform.tfvars.example` y `infra/backend.hcl.example` a archivos sin el sufijo `.example`. El bucket debe existir antes de `init` local; el pipeline lo crea automáticamente.

```bash
terraform -chdir=infra init -backend-config=backend.hcl
terraform -chdir=infra plan
terraform -chdir=infra apply
terraform -chdir=infra output
```

Para validar sin acceso a la cuenta: `terraform -chdir=infra init -backend=false` y `terraform -chdir=infra validate`. La configuración de Ansible se valida en Linux/WSL con:

```bash
pip install -r scripts/requirements.txt
ansible-galaxy collection install -r ansible/requirements.yml
cd ansible
ansible-playbook -i 'localhost,' playbook.yml --syntax-check
```

## Cloudflare

**Con dominio propio:** crear un túnel administrado en Cloudflare y configurar su hostname público hacia `http://app:3000`. Guardar el token en `CLOUDFLARE_TUNNEL_TOKEN`. Para esta modalidad mantener `SITE_ADDRESS=:80`: el túnel termina HTTPS y entrega HTTP dentro de la red Docker. La URL pública será el hostname configurado en Cloudflare. Cloudflare no registra un dominio gratuito por activar un túnel; se necesita un dominio existente para un hostname permanente.

**Sin dominio:** establecer `ENABLE_DEMO_TUNNEL=true`. El pipeline arranca el perfil `demo` y agrega la URL de `trycloudflare.com` al resumen de Actions. Esta URL es temporal y puede cambiar al recrear el contenedor. No sustituye a un dominio estable.

En local:

```bash
docker compose --profile demo up -d --build
docker compose logs quick-tunnel
```

## Datos y operación

- `GET /api/projects`: proyectos de SQLite; filtro opcional `?category=Videojuegos`.
- `POST /api/contact`: validación en cliente y servidor, consultas parametrizadas y límite de 5 solicitudes por IP cada 15 minutos.
- `GET /api/health`: comprueba acceso a SQLite.
- Los contactos permanecen en `/app/data/portfolio.sqlite`, dentro del volumen Docker. No hay endpoint público para consultarlos.
- Actualizar la imagen conserva el volumen. Antes de reemplazar o destruir una VM, realizar una copia consistente de SQLite mediante su API de backup y guardarla fuera de la VM. El volumen local no es un backup.
- Inspección: `sudo docker compose --project-directory /opt/ramiro-portfolio logs --tail=100`.
- Ansible persiste reglas mediante UFW y un servicio systemd que repone las reglas INPUT y DOCKER-USER después de iniciar Docker. La red OCI restringe SSH; UFW permite 22/80/443. El puerto de SQLite/Express no se publica.
- `terraform destroy` elimina la infraestructura del portafolio y puede eliminar los datos de la VM. No ejecutarlo sin backup y confirmación. El bucket remoto de estado no se elimina desde esta configuración.

## Fuentes técnicas

- [Secretos de GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Backend OCI con bloqueo de estado](https://developer.hashicorp.com/terraform/language/backend/oci)
- [Imágenes de OCI en Terraform](https://registry.terraform.io/providers/oracle/oci/latest/docs/data-sources/core_images)
- [Firewall y puertos de Docker](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Quick Tunnels de Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
