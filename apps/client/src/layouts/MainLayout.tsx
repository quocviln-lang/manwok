import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div>
      <header>Header</header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
