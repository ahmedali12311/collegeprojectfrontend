import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AddProjectForm from './addpreprojectform'; // Assuming this form works for both projects and pre-projects
import '../../style/ProjectList.css';
import { jwtDecode } from 'jwt-decode';

const PreProjects = () => {
  const [preProjects, setPreProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false); // Loading state
  const token = localStorage.getItem("token");
  const [isGraduationStudent, setIsGraduationStudent] = useState(false); // New state for graduation_student role
  useEffect(() => {
    const checkUserRole = () => {
      if (token) {
        const decodedToken = jwtDecode(token);
        setIsGraduationStudent(decodedToken.user_role.includes("graduation_student"));
      }
    };
    checkUserRole();
  }, [token, isGraduationStudent]);
  


  const fetchPreProjects = useCallback(() => {
    setLoading(true);

    const query = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : '';
    fetch(`http://localhost:8080/preproject?page=${page}&per_page=${perPage}&sort=${sortOrder === 'asc' ? '' : '-'}${sortField}${query}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setPreProjects(data.pre_projects || []); // assuming API returns { projects: [], meta: {} }
        setMeta(data.meta || {});
        
      })
      .catch(error => {
        console.error('Error fetching pre-projects:', error);
      }).finally(() => {
        setLoading(false); // Set loading to false after fetching
      });
  }, [page, perPage, sortOrder, sortField, searchTerm]);

  useEffect(() => {
    fetchPreProjects();
  }, [fetchPreProjects]);

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
      <h1>مشاريع المقدمة</h1>

      {isGraduationStudent && (
        <button onClick={handleAddButtonClick} className="add-project-btn">إضافة مقدمة مشروع</button>
      )}

      <div className="controls">
        <input
          type="text"
          placeholder="ابحث عن مشاريع المقدمة..."
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
    <p>جاري تحميل مشاريع المقدمة ...</p>
  </div>      ) :(
      <ul className="project-list">
        {preProjects.length > 0 ? (
          preProjects.map((project) => (
            <li key={project.id} className="project-item">
              <Link to={`/PreProjects/${project.id}`}>
      <h3 className="project-name">{project.name}</h3>
      <p className="project-description">{project.description}</p>
    </Link>
            </li>
          ))
        ) : (
          <h1 className="no-projects">لا يوجد مشاريع مقدمة</h1>
        )}
      </ul>
  )};

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
      {showAddForm && isGraduationStudent && (
        <div className="overlay">
          <AddProjectForm closeForm={() => setShowAddForm(false)} refreshProjects={fetchPreProjects} />
        </div>
      )}
    </div>
  );
};

export default PreProjects;
