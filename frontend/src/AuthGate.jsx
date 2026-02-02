// src/AuthGate.jsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const LS = {
  useMsSso: "useMsSso",
  msAccessToken: "msAccessToken",
  mongoUserId: "mongoUserId",
  accountType: "accountType",
  authProvider: "authProvider",
  msUpn: "msUpn",
};

const ME = gql`
  query Me {
    me {
      firstName
      lastName
      user_email
      msUpn
      authProvider
      profileComplete
      accountType
      _id
    }
  }
`;

export default function AuthGate() {
  const navigate = useNavigate();

  // ✅ Determine whether this gate should even run (SSO only)
  const useMs = useMemo(() => localStorage.getItem(LS.useMsSso) === "true", []);
  const msToken = useMemo(() => localStorage.getItem(LS.msAccessToken) || "", []);
  const shouldCheckMe = useMs && !!msToken;

  const { data, loading, error } = useQuery(ME, {
    fetchPolicy: "network-only",
    skip: !shouldCheckMe,
  });

  useEffect(() => {
    // If user is NOT in SSO flow, AuthGate shouldn't be used
    if (!shouldCheckMe) {
      navigate("/login", { replace: true });
      return;
    }

    if (loading) return;

    if (error) {
      console.error("AuthGate GraphQL error:", error);
      // If token is bad/expired, reset SSO mode and go login
      localStorage.setItem(LS.useMsSso, "false");
      localStorage.removeItem(LS.msAccessToken);
      navigate("/login", { replace: true });
      return;
    }

    const me = data?.me;

    // No user record yet -> go to signup (autofill will come from ME query there too)
    if (!me) {
      navigate("/signup", { replace: true });
      return;
    }

    // Save basics (safe to store even if profile incomplete)
    if (me._id) localStorage.setItem(LS.mongoUserId, me._id);
    if (me.accountType) localStorage.setItem(LS.accountType, me.accountType);

    localStorage.setItem(LS.authProvider, me.authProvider || "");
    localStorage.setItem(LS.msUpn, (me.msUpn || me.user_email || "").trim());

    // ✅ IMPORTANT: only allow main menu if server says profile complete
    if (me.profileComplete === true) {
      navigate("/mainmenu", { replace: true });
      return;
    }

    // Otherwise, force them to finish signup
    navigate("/signup", {
      replace: true,
      state: {
        autofill: {
          firstName: me.firstName || "",
          lastName: me.lastName || "",
          email: me.user_email || "",
        },
      },
    });
  }, [shouldCheckMe, loading, error, data, navigate]);

  return <div style={{ padding: 20 }}>Checking your account…</div>;
}
