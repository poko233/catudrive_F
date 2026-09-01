// app/(app)/_layout.tsx
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Stack } from "expo-router/stack";

export default function AppLayoutGroup() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Stack screenOptions={{ headerShown: false }} />
      </AppLayout>
    </ProtectedRoute>
  );
}
