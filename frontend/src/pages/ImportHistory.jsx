import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import PageHeader from '../components/ui/PageHeader';
import { fetchImportHistory } from '../services/mockApi';
import { useApp } from '../context/AppContext';

const ImportHistory = () => {
  const { user } = useApp();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchImportHistory(user.role, user.department);
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <>
      <PageHeader
        breadcrumb="HOME / IMPORT / HISTORY"
        title="Import History"
        subtitle="All past Excel imports performed by your department or system-wide."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">No imports yet.</div>
          ) : (
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
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
                    <td><Badge bg="success">{h.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default ImportHistory;