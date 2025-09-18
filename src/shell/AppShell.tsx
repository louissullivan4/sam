import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Content,
} from "@carbon/react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Logout } from "@carbon/icons-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import useUser from "../components/useUser";
import { useEffect } from "react";

export default function AppShell() {
  const loc = useLocation();
  const { userData, userLoading } = useUser();
  
  useEffect(() => {
    if (!userLoading && userData?.role === "Pending") {
      signOut(auth);
    }
  }, [userData, userLoading]);

  return (
    <>
      <Header aria-label="Camping Adventure Skills Assessments">
        <HeaderName as={Link} to="/" prefix="SCAM">
          Scouts Camping Assessments Manager
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label="Account"
            onClick={() => signOut(auth)}
          >
            <Logout size={30} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <SideNav isFixedNav expanded aria-label="Side navigation">
        <SideNavItems>
          <SideNavLink
            href="/requests"
            isActive={loc.pathname.startsWith("/requests")}
          >
            Requests
          </SideNavLink>
          <SideNavLink
            href="/assessments"
            isActive={loc.pathname.startsWith("/assessments")}
          >
            My Assessments
          </SideNavLink>
          {userData?.role === "Admin" && (
            <SideNavLink
              href="/admin/users"
              isActive={loc.pathname.startsWith("/admin/users")}
            >
              Admin Dashboard
            </SideNavLink>
          )}
        </SideNavItems>
      </SideNav>
      <Content id="main-content" style={{ marginLeft: 256, padding: 24 }}>
        <Outlet />
      </Content>
    </>
  );
}
