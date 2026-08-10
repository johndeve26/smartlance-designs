import { redirect } from "next/navigation";
import { acceptProspectMagicLink } from "@/lib/prospect/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  try {
    await acceptProspectMagicLink(token);
  } catch {
    redirect("/workspace/login?error=invalid");
  }
  redirect("/workspace");
}
