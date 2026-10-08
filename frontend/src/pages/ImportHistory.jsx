import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { FiTrash2 } from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import { fetchImportHistory, deleteImportHistoryRecord, clearDepartmentStudents } from '../services/mockApi';
import { useApp } from '../context/AppContext';

const ImportHistory = () => {
  const { user } = useApp();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const {
    currentPage, totalPages, paginatedItems,
    goToPage, startIndex, endIndex, totalItems,
  } = usePagination(history, 8);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchImportHistory(user.role, user.department);
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleDeleteRecord = async (historyId) => {
    if (!window.confirm('Delete this import history record? (Students will NOT be deleted.)')) return;
    setDeleting(historyId);
    try {
      await deleteImportHistoryRecord(historyId, user.role, user.department);
      await load();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteStudents = async (department, count) => {
    if (!window.confirm(
      `⚠️ This will DELETE ALL ${count} students in ${department} department.\n\n` +
      `This cannot be undone.\n\nContinue?`
    )) return;

    try {
      const res = await clearDepartmentStudents(department, user.role, user.department);
      alert(`✅ ${res.message}`);
      await load();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="HOME / IMPORT / HISTORY"
        title="Import History"
        subtitle="Past Excel imports. You can delete records or clear a department's students."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">No imports yet.</div>
          ) : (
            <>
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Uploaded By</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Total</th>
                    <th>New</th>
                    <th>Updated</th>
                    <th>Failed</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(h => (
                    <tr key={h.id}>
                      <td className="fw-semibold">{h.file_name}</td>
                      <td>{h.uploaded_by}</td>
                      <td><Badge bg="info">{h.role}</Badge></td>
                      <td>{h.department}</td>
                      <td>{h.total_rows}</td>
                      <td className="text-success fw-semibold">{h.new_students}</td>
                      <td className="text-info fw-semibold">{h.updated_students}</td>
                      <td className="text-danger fw-semibold">{h.failed_rows}</td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {h.uploaded_at ? new Date(h.uploaded_at).toLocaleString() : '—'}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="me-1"
                          onClick={() => handleDeleteRecord(h.id)}
                          disabled={deleting === h.id}
                          title="Delete this history record only"
                        >
                          {deleting === h.id ? <Spinner size="sm" /> : <FiTrash2 />}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteStudents(h.department, h.new_students + h.updated_students)}
                          title={`Delete all students in ${h.department}`}
                        >
                          Clear Dept
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default ImportHistory;