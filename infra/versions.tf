terraform {
  required_version = ">= 1.12, < 2.0"
  required_providers {
    oci = { source = "oracle/oci", version = "~> 9.14.0" }
  }
  backend "oci" {}
}

provider "oci" {
  region              = var.region
  config_file_profile = "DEFAULT"
}
