output "instance_public_ip" {
  value       = oci_core_instance.portfolio.public_ip
  description = "IP pública de la VM del portafolio."
}
output "instance_id" {
  value = oci_core_instance.portfolio.id
}
output "vcn_id" {
  value = oci_core_vcn.portfolio.id
}
output "subnet_ids" {
  value = { public = oci_core_subnet.public.id, private = oci_core_subnet.private.id }
}
