import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Users, School, Book, ChevronRight } from 'lucide-react';

const StudentBatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line
  }, [search, page]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/user/my-batches', {
        params: {
          search,
          page,
          limit: pageSize,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      if (response.data.success) {
        setBatches(response.data.batches || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load your batches');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 mt-12 sm:mt-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1 break-words">My Batches</h1>
            <p className="text-gray-400 text-sm sm:text-base">View all of your enrolled batches</p>
          </div>
          <div className="w-full lg:w-80">
            <input
              type="text"
              placeholder="Search batches..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full shadow text-sm sm:text-base"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-gray-800/80 rounded-2xl shadow-2xl p-8 sm:p-10 text-center backdrop-blur-md">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">
              {search ? 'No Matching Batches Found' : 'No Batches Found'}
            </h2>
            <p className="text-gray-400 mb-6 text-sm sm:text-base max-w-md mx-auto">
              {search 
                ? `No batches found matching "${search}". Try a different search term.`
                : 'You are not enrolled in any batches yet. Please contact your instructor or administrator if you believe this is incorrect.'
              }
            </p>
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {batches.map(batch => (
              <div
                key={batch._id}
                className="bg-gray-800/80 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden hover:scale-[1.02] hover:shadow-blue-700/30 border border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer backdrop-blur-md group active:scale-[0.98] touch-manipulation"
                onClick={() => navigate(`/student/batch/${batch._id}`)}
              >
                <div className="bg-gradient-to-r from-blue-800/80 to-indigo-900/80 h-2"></div>
                <div className="p-4 sm:p-6">
                  {/* Batch Name */}
                  <div className="flex items-start gap-2 mb-3">
                    <School className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <h3 
                      className="font-bold text-base sm:text-lg group-hover:text-blue-400 transition-colors leading-tight break-words hyphens-auto"
                      title={batch.name}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                      }}
                    >
                      {batch.name || 'Unnamed Batch'}
                    </h3>
                  </div>

                  {/* Subject */}
                  {batch.subject && (
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                      <Book size={14} className="flex-shrink-0" />
                      <span 
                        className="truncate" 
                        title={batch.subject}
                      >
                        {batch.subject}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {batch.description && (
                    <div className="mb-4">
                      <p 
                        className="text-gray-400 text-sm leading-relaxed break-words hyphens-auto"
                        title={batch.description}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word'
                        }}
                      >
                        {batch.description}
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex flex-col gap-2 mt-4 text-sm border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={16} className="flex-shrink-0" />
                      <span>{batch.students?.length || 0} Student{(batch.students?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <Book size={16} className="flex-shrink-0" />
                      <span>{batch.assignedProblems?.length || 0} Problem{(batch.assignedProblems?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="font-semibold flex-shrink-0">Faculty:</span>
                      <span 
                        className="truncate" 
                        title={batch.faculty?.username || 'Not assigned'}
                      >
                        {batch.faculty?.username || 'Not assigned'}
                      </span>
                    </div>
                  </div>

                  {/* View Details */}
                  <div className="flex items-center justify-end mt-4 pt-2">
                    <div className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm group-hover:translate-x-1 transition-transform">
                      <span>View Details</span>
                      <ChevronRight size={16} className="flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 sm:mt-10">
            <button
              className="w-full sm:w-auto px-4 py-2 sm:py-3 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-blue-300 font-semibold text-base sm:text-lg whitespace-nowrap">
              Page {page} of {totalPages}
            </span>
            <button
              className="w-full sm:w-auto px-4 py-2 sm:py-3 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentBatchList;
