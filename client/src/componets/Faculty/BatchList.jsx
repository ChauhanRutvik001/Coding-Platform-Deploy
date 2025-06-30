import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Users, School, Book, Calendar, ChevronRight, Search, UsersRound, ArrowUpDown, ChevronsLeft, ChevronsRight } from 'lucide-react';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalBatches, setTotalBatches] = useState(0);
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchBatches(1, sortBy, sortOrder, searchTerm);
    }, 400);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line
  }, [searchTerm]);

  const fetchBatches = async (
    fetchPage = page,
    fetchSortBy = sortBy,
    fetchSortOrder = sortOrder,
    fetchSearch = searchTerm
  ) => {
    setLoading(true);
    try {
      const params = {
        page: fetchPage,
        limit,
        sortBy: fetchSortBy,
        sortOrder: fetchSortOrder,
        search: fetchSearch,
      };
      const response = await axiosInstance.get('/faculty/batches', { params });
      // console.log('Fetched batches:', response.data);
      if (response.data.success) {
        setBatches(response.data.batches);
        setTotalPages(response.data.totalPages);
        setTotalBatches(response.data.totalBatches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-20 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-400 tracking-tight drop-shadow-lg">My Batches</h1>
            <p className="text-gray-400 mt-2 text-lg">Manage your assigned student batches and track their progress</p>
          </div>
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none w-full text-base"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-400 text-sm">
            Showing <span className="text-blue-400 font-semibold">{batches.length}</span> of <span className="text-blue-400 font-semibold">{totalBatches}</span> batches
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition text-sm ${sortBy === 'createdAt' ? 'text-blue-400' : 'text-gray-300'}`}
              onClick={() => handleSort('createdAt')}
            >
              <ArrowUpDown size={16} />
              Latest
            </button>
            <button
              className={`flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition text-sm ${sortBy === 'name' ? 'text-blue-400' : 'text-gray-300'}`}
              onClick={() => handleSort('name')}
            >
              <ArrowUpDown size={16} />
              Name
            </button>
            <button
              className={`flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition text-sm ${sortBy === 'subject' ? 'text-blue-400' : 'text-gray-300'}`}
              onClick={() => handleSort('subject')}
            >
              <ArrowUpDown size={16} />
              Subject
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-10 text-center">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">No Batches Found</h2>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No batches match your search criteria.' : "You haven't been assigned any batches yet. Please contact an administrator if you believe this is incorrect."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {batches.map(batch => (
              <div
                key={batch._id}
                className="relative group bg-gray-900 rounded-2xl shadow-lg border border-gray-800 hover:border-blue-500 transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.03]"
                onClick={() => navigate(`/faculty/batches/${batch._id}`)}
              >
                {/* Status badge */}
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10 tracking-wide shadow-md ${batch.isActive ? 'bg-green-800/80 text-green-300' : 'bg-red-800/80 text-red-300'}`}>
                  {batch.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 h-2 w-full" />
                <div className="p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <School className="text-blue-400" size={22} />
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors truncate">{batch.name}</h2>
                  </div>
                  {batch.subject && (
                    <div className="flex items-center gap-1 text-sm text-blue-200 mb-1">
                      <Book size={15} />
                      <span className="truncate">{batch.subject}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-1">
                    {batch.semester && (
                      <span className="bg-blue-900/60 text-blue-300 px-2 py-1 rounded text-xs font-medium">Sem: {batch.semester}</span>
                    )}
                    {batch.branch && (
                      <span className="bg-indigo-900/60 text-indigo-300 px-2 py-1 rounded text-xs font-medium">Branch: {batch.branch}</span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-2 text-sm min-h-[2.2rem] line-clamp-2">{batch.description || 'No description provided'}</p>
                  <div className="flex flex-col gap-1 border-t border-gray-800 pt-2 mt-2">
                    <div className="flex items-center text-xs text-gray-300 gap-2">
                      <UsersRound size={13} className="text-blue-400" />
                      <span>Students:</span>
                      <span className="font-semibold text-blue-200">{batch.students ? batch.students.length : 0}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-300 gap-2">
                      <Book size={13} className="text-blue-400" />
                      <span>Problems:</span>
                      <span className="font-semibold text-blue-200">{batch.assignedProblems ? batch.assignedProblems.length : 0}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-300 gap-2">
                      <Calendar size={13} className="text-blue-400" />
                      <span>Created:</span>
                      <span className="font-semibold text-blue-200">{formatDate(batch.createdAt)}</span>
                    </div>
                    
                  </div>
                  <div className="flex justify-end mt-3">
                    <Link
                      to={`/faculty/batches/${batch._id}`}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-200 transition font-semibold border border-blue-700 px-3 py-1 rounded-lg bg-blue-900/30 shadow-sm text-xs"
                      onClick={e => e.stopPropagation()}
                    >
                      <span>View</span>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronsLeft size={20} />
          </button>
          <span className="text-blue-300 font-semibold text-lg">
            Page {page} of {totalPages}
          </span>
          <button
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default BatchList;
