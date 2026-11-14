import generatedTenant from "@/config/tenant.generated.json";

type TenantConfig = {
  id: string;
  tenantName: string;
  appName: string;
  loginTitle: string;
  headerTitle: string;
  rootFolderLabel: string;
  loginBackgroundImage: string;
};

const tenant: TenantConfig = generatedTenant;

export function getFolderDisplayPath(relativePath: string): string {
  return `${tenant.rootFolderLabel.replace(/\/+$/, "")}/${relativePath}`;
}

export default tenant;
