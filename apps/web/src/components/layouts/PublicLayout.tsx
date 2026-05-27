import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
