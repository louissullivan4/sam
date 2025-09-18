import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Content,
  HeaderMenuButton,
  SkipToContent,
} from "@carbon/react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Logout } from "@carbon/icons-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import useUser from "../components/useUser";
import { useCallback, useEffect, useState } from "react";
import useIsSmallScreen from "../hooks/useIsSmallScreen";

export default function AppShell() {
  const loc = useLocation();
  const { userData, userLoading } = useUser();
  const isSmall = useIsSmallScreen();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!userLoading && userData?.role === "Pending") {
      signOut(auth);
    }
  }, [userData, userLoading]);

  useEffect(() => {
    if (isSmall) setNavOpen(false);
  }, [loc.pathname, isSmall]);

  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);

  return (
    <>
      <SkipToContent />
      <Header aria-label="Camping Adventure Skills Assessments">
        <HeaderMenuButton
          aria-label="Open menu"
          isCollapsible
          onClick={toggleNav}
          isActive={navOpen}
        />
        <HeaderName as={Link} to="/" prefix="SAM">
          Scouting Assessments Manager
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label="Sign out"
            onClick={() => signOut(auth)}
          >
            <Logout size={30} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>

      <SideNav
        isFixedNav={!isSmall}
        expanded={!isSmall || navOpen}
        aria-label="Side navigation"
        onOverlayClick={() => setNavOpen(false)}
      >
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

      <Content id="main-content" className="app-content">
        <Outlet />
      </Content>
    </>
  );
}
