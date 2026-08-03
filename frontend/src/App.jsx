import { useState, useEffect } from "react";
import Analytics from "./pages/Analytics.jsx";
import ShortUrl from "./pages/ShortUrl.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Modal from "./components/Modal.jsx";
import SkeletonLoader from "./components/SkeletonLoader.jsx";
import CreateLongUrlForm from "./components/shared/CreateLongUrlForm.jsx";
import { getAllUrls } from "./api/shortUrl.api.js";
import { getMe, signOut } from "./api/auth.api.js";

function App() {
  const [authView, setAuthView] = useState("signin"); // signin | signup
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateLongModalOpen, setIsCreateLongModalOpen] = useState(false);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUrls = () => {
    setLoading(true);
    getAllUrls()
      .then((res) => {
        setData(res.urls || []);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    fetchUrls();
  };

  const handleAuthSuccess = (res) => {
    setUser(res.user);
    setAuthView("signin");
    fetchUrls();
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setData([]);
      setAuthView("signin");
    }
  };

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.user);
        fetchUrls();
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  if (authChecking) return <SkeletonLoader />;

  if (!user) {
    return authView === "signup" ? (
      <SignUp
        onNavigateSignIn={() => setAuthView("signin")}
        onSignUpSuccess={handleAuthSuccess}
      />
    ) : (
      <SignIn
        onNavigateSignUp={() => setAuthView("signup")}
        onSignInSuccess={handleAuthSuccess}
      />
    );
  }

  if (loading && data.length === 0) return <SkeletonLoader />;

  return (
    <>
      <Analytics
        links={data}
        isLoading={loading}
        onCreateNew={() => setIsCreateModalOpen(true)}
        onCreateLongLink={() => setIsCreateLongModalOpen(true)}
        onLogout={handleLogout}
        onUserUpdate={setUser}
        onLinksRefresh={fetchUrls}
        user={user}
      />

      <Modal
        open={isCreateModalOpen}
        onClose={closeModal}
        title="Create new short link"
      >
        <ShortUrl onSuccess={closeModal} />
      </Modal>

      <Modal
        open={isCreateLongModalOpen}
        onClose={() => setIsCreateLongModalOpen(false)}
        title="Save a new Long Link"
      >
        <CreateLongUrlForm onSuccess={() => setIsCreateLongModalOpen(false)} />
      </Modal>
    </>
  );
}

export default App;
