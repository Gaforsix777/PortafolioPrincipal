data "oci_identity_availability_domains" "available" {
  compartment_id = var.compartment_ocid
}

data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_vcn" "portfolio" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.42.0.0/16"]
  display_name   = "portfolio-vcn"
  dns_label      = "portfolio"
}

resource "oci_core_internet_gateway" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portfolio-internet"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.public.id
  }
}

resource "oci_core_security_list" "web" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portfolio-web-ssh"
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
  dynamic "ingress_security_rules" {
    for_each = toset([80, 443])
    content {
      protocol = "6"
      source   = "0.0.0.0/0"
      tcp_options {
        min = ingress_security_rules.value
        max = ingress_security_rules.value
      }
    }
  }
  dynamic "ingress_security_rules" {
    for_each = var.ssh_cidrs
    content {
      protocol = "6"
      source   = ingress_security_rules.value
      tcp_options {
        min = 22
        max = 22
      }
    }
  }
  ingress_security_rules {
    protocol = "1"
    source   = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portfolio-private-isolated"
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.portfolio.id
  cidr_block                 = "10.42.1.0/24"
  display_name               = "portfolio-public"
  dns_label                  = "web"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.web.id]
  prohibit_public_ip_on_vnic = false
}

resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.portfolio.id
  cidr_block                 = "10.42.2.0/24"
  display_name               = "portfolio-private"
  dns_label                  = "internal"
  security_list_ids          = [oci_core_security_list.private.id]
  prohibit_public_ip_on_vnic = true
}

resource "oci_core_instance" "portfolio" {
  compartment_id      = var.compartment_ocid
  availability_domain = coalesce(var.availability_domain, data.oci_identity_availability_domains.available.availability_domains[0].name)
  display_name        = "ramiro-portfolio-ubuntu2404"
  shape               = var.shape
  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = 50
  }
  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    hostname_label   = "portfolio"
  }
  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/cloud-init.yml"))
  }
  lifecycle {
    # A new catalog image must not replace a VM containing persistent contacts.
    ignore_changes = [source_details[0].source_id]
    precondition {
      condition     = length(data.oci_core_images.ubuntu.images) > 0
      error_message = "No hay una imagen Ubuntu 24.04 compatible con la forma en esta región."
    }
  }
}
