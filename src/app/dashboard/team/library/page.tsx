import { redirect } from "next/navigation";

export default function SharedLibraryRedirectPage() {
  redirect("/dashboard/team/scripts");
}
