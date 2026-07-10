import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function ConfirmDialog({ show, onClose, onConfirm, title, message, confirmText = 'Hapus', variant = 'danger' }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton style={{ background: '#1a2233', borderBottom: '1px solid #2a3444' }}>
        <Modal.Title style={{ color: '#e8edf5' }}>{title || 'Konfirmasi'}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#0b0e14', color: '#e8edf5' }}>
        <p>{message || 'Apakah Anda yakin?'}</p>
      </Modal.Body>
      <Modal.Footer style={{ background: '#0b0e14', borderTop: '1px solid #2a3444' }}>
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmDialog;