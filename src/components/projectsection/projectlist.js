import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AddProjectForm from './Add_EDIT_ProjectForms/addprojectoform';
import '../../style/ProjectList.css';
import { jwtDecode } from 'jwt-decode';
const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [meta, setMeta] = useState({});
const [loading,setLoading]=useState(false);
const [isAdmin,setIsAdmin]=useState(false);

const checkUserRole = () => {
  const token = localStorage.getItem("token");
  if (token) {
    const decodedToken = jwtDecode(token);
    setIsAdmin(decodedToken.user_role && decodedToken.user_role.includes("admin"));
  }
}
useEffect(() => {
  checkUserRole(); // Check user role on component mount
}, []);


const fetchProjects = useCallback(() => {
  setLoading(true);
  const query = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : '';
  fetch(
    `http://localhost:8080/book?page=${page}&per_page=${perPage}&sort=${
      sortOrder === 'asc' ? '' : '-'
    }${sortField}${query}`
  )
    .then((response) => response.json())
    .then((data) => {
      // Map books from the response
      const books = data.books.map((book) => ({
        id: book.id, // Adjusted to match the response
        name: book.name, // Adjusted to match the response
        description: book.description, // Adjusted to match the response
      }));

      // Remove duplicates based on 'id' using a Map
      const uniqueBooks = Array.from(
        new Map(books.map((book) => [book.id, book])).values()
      );

      setProjects(uniqueBooks);
      setMeta(data.meta || {});
    })
    .catch((error) => {
      console.error('Error fetching books:', error);
    })
    .finally(() => {
      setLoading(false);
    });
}, [page, perPage, sortOrder, sortField, searchTerm]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const sections = document.querySelectorAll('section');
    const options = { threshold: 0.25 };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    sections.forEach(section => observer.observe(section));

    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to the first page when searching
  };

  const handleAddButtonClick = () => setShowAddForm(true);

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('|');
    setSortField(field);
    setSortOrder(order);
    setPage(1); // Reset to the first page when sorting
  };

  // Manage pagination
  const goToNextPage = () => {
    if (meta.current_page < meta.last_page) setPage(page + 1);
  };

  const goToPreviousPage = () => {
    if (meta.current_page > meta.first_page) setPage(page - 1);
  };

  return (
    <div id="project-list-container">
            <h1>مشاريع التخرج</h1>

          {isAdmin && (
        <button onClick={handleAddButtonClick} className="add-project-btn">إضافة مشروع</button>
      )}


      <div className="controls">
        <input
          type="text"
          placeholder="ابحث عن المشاريع..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />

        <select onChange={handleSortChange} value={`${sortField}|${sortOrder}`} className="sort-select">
          <option value="name|asc">ترتيب حسب الاسم من أ الى ي</option>
          <option value="name|desc">ترتيب حسب الاسم من ي الى أ</option>
          <option value="created_at|asc">ترتيب حسب تاريخ الإنشاء من الأقدم إلى الأحدث</option>
          <option value="created_at|desc">ترتيب حسب تاريخ الإنشاء من الأحدث إلى الأقدم</option>
        </select>
      </div>
      {loading ? (
    <div className="loading-state">
    <div className="spinner"></div>
    <p>جاري تحميل مشاريع القسم ...</p>
  </div>      ) :(
      <ul className="project-list">
  {projects.length > 0 ? (
    projects.map((project, index) => (
<li key={project.id} className="project-item">
          <Link to={`/Projects/${project.id}`}>
          <h3 className="project-name">{project.name}</h3>
          <p className="project-description">{project.description}</p>
        </Link>
      </li>
    ))
  ) : (
    <h1 className="no-projects">لا يوجد مشاريع</h1>
  )}
</ul>
  )}
      <div className="pagination">
        <button
          onClick={goToPreviousPage}
          disabled={meta.current_page === meta.first_page}
          className="pagination-btn"
        >
          السابق
        </button>
        <span>الصفحة {meta.current_page} من {meta.last_page}</span>
        <button
          onClick={goToNextPage}
          disabled={meta.current_page === meta.last_page}
          className="pagination-btn"
        >
          التالي
        </button>
      </div>


      {showAddForm && (
        <div className="overlay">
          <AddProjectForm closeForm={() => setShowAddForm(false)} refreshProjects={fetchProjects} />
        </div>
      )}
    </div>
  );
};

export default ProjectList;