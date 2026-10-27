import { Suspense } from "react";
import ProfilePageContent from "./ProfilePageContent";

export default function ProfilePage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <ProfilePageContent />
    </Suspense>
  );
}
