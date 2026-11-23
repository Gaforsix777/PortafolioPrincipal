variable "region" {
  type    = string
  default = "sa-saopaulo-1"
}
variable "compartment_ocid" {
  type        = string
  description = "Compartimento OCI para los recursos del portafolio."
}
variable "availability_domain" {
  type    = string
  default = null
}
variable "ssh_public_key" {
  type        = string
  description = "Clave pública correspondiente al secreto SSH_PRIVATE_KEY de GitHub."
}
variable "ssh_cidrs" {
  type        = set(string)
  description = "CIDR del runner y, opcionalmente, del administrador. Nunca abrir SSH a todo Internet."
  validation {
    condition     = length(var.ssh_cidrs) > 0 && alltrue([for cidr in var.ssh_cidrs : can(cidrnetmask(cidr)) && cidr != "0.0.0.0/0"])
    error_message = "Usa al menos un CIDR IPv4 específico para SSH."
  }
}
variable "shape" {
  type    = string
  default = "VM.Standard.E2.1.Micro"
}
