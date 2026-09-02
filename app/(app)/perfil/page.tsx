import { ProfileStudio } from "@/components/profile-studio";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileStudio user={user} />;
}
