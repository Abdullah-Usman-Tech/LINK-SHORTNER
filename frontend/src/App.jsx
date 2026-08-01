import { useState } from "react";
import Analytics from "./pages/Analytics.jsx";
import ShortUrl from "./pages/ShortUrl.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Modal from "./components/Modal.jsx";
import SkeletonLoader from "./components/SkeletonLoader.jsx";
import { useEffect } from "react";
import { getAllUrls } from "./api/shortUrl.api.js";

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUrls = () => {
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

  useEffect(() => {
    fetchUrls();
  }, []);

  if (loading) return <SkeletonLoader />;

  return (
    <>
      <Analytics links={data} onCreateNew={() => setIsCreateModalOpen(true)} />

      <Modal
        open={isCreateModalOpen}
        onClose={closeModal}
        title="Create new link"
      >
        <ShortUrl onSuccess={closeModal} />
      </Modal>
    </>
  );
}

export default App;
