import { useState, useEffect } from "react";
import Analytics from "./pages/Analytics.jsx";
import ShortUrl from "./pages/ShortUrl.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Modal from "./components/Modal.jsx";
import SkeletonLoader from "./components/SkeletonLoader.jsx";
import CreateLongUrlForm from "./components/shared/CreateLongUrlForm.jsx";
import { getAllUrls } from "./api/shortUrl.api.js";

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateLongModalOpen, setIsCreateLongModalOpen] = useState(false);

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
      <Analytics
        links={data}
        onCreateNew={() => setIsCreateModalOpen(true)}
        onCreateLongLink={() => setIsCreateLongModalOpen(true)}
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
