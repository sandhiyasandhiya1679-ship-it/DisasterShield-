
import { useEffect, useState } from 'react'
import {
  getShelters,
  createShelter,
  updateShelter,
  deleteShelter
} from '../services/shelterService'
import './Shelters.css'

const emptyForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  capacity: '',
  currentOccupancy: '0',
  facilities: '',
  contactNumber: '',
  status: 'OPEN'
}

function Shelters() {
  const [shelters, setShelters] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadShelters = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getShelters()
      setShelters(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load shelters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShelters()
  }, [])

  const openAddForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setMessage('')
    setShowForm(true)
  }

  const openEditForm = (shelter) => {
    setForm({
      name: shelter.name || '',
      address: shelter.address || '',
      latitude: shelter.location?.latitude ?? '',
      longitude: shelter.location?.longitude ?? '',
      capacity: String(shelter.capacity ?? ''),
      currentOccupancy: String(shelter.currentOccupancy ?? 0),
      facilities: Array.isArray(shelter.facilities)
        ? shelter.facilities.join(', ')
        : shelter.facilities || '',
      contactNumber: shelter.contactNumber || '',
      status: shelter.status || 'OPEN'
    })
    setEditingId(shelter._id)
    setError('')
    setMessage('')
    setShowForm(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const capacity = Number(form.capacity)
    const currentOccupancy = Number(form.currentOccupancy)
    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)

    if (!form.name.trim() || !form.address.trim()) {
      setError('Please enter the shelter name and address.')
      return
    }

    if (
      form.capacity === '' ||
      form.currentOccupancy === '' ||
      !Number.isInteger(capacity) ||
      !Number.isInteger(currentOccupancy) ||
      capacity < 1 ||
      currentOccupancy < 0
    ) {
      setError('Enter a valid capacity and occupancy.')
      return
    }

    if (currentOccupancy > capacity) {
      setError('Current occupancy cannot exceed capacity.')
      return
    }

    if (
      form.latitude === '' ||
      form.longitude === '' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError('Enter valid latitude and longitude coordinates.')
      return
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      location: { latitude, longitude },
      capacity,
      currentOccupancy,
      facilities: form.facilities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      contactNumber: form.contactNumber.trim(),
      status:
        form.status === 'CLOSED'
          ? 'CLOSED'
          : currentOccupancy >= capacity
            ? 'FULL'
            : 'OPEN'
    }

    try {
      setSaving(true)

      if (editingId) {
        await updateShelter(editingId, payload)
        setMessage('Shelter updated successfully.')
      } else {
        await createShelter(payload)
        setMessage('Shelter created successfully.')
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadShelters()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save shelter.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (shelter) => {
    const nextStatus = shelter.status === 'CLOSED'
      ? (shelter.currentOccupancy >= shelter.capacity ? 'FULL' : 'OPEN')
      : 'CLOSED'

    const confirmed = window.confirm(
      `${nextStatus === 'CLOSED' ? 'Close' : 'Reopen'} "${shelter.name}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setMessage('')
      await updateShelter(shelter._id, { status: nextStatus })
      setMessage(`Shelter ${nextStatus === 'CLOSED' ? 'closed' : 'reopened'} successfully.`)
      await loadShelters()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update shelter status.')
    }
  }

  const handleDelete = async (shelter) => {
    if (!window.confirm(`Delete "${shelter.name}"? This cannot be undone.`)) {
      return
    }

    try {
      setError('')
      setMessage('')
      await deleteShelter(shelter._id)
      setMessage('Shelter deleted successfully.')
      await loadShelters()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete shelter.')
    }
  }

  const filteredShelters = shelters.filter((shelter) => {
    const text = [
      shelter.name,
      shelter.address,
      shelter.status,
      ...(Array.isArray(shelter.facilities) ? shelter.facilities : [])
    ].join(' ').toLowerCase()

    return text.includes(search.toLowerCase())
  })

  const totalCapacity = shelters.reduce(
    (total, shelter) => total + Number(shelter.capacity || 0), 0
  )
  const totalOccupancy = shelters.reduce(
    (total, shelter) => total + Number(shelter.currentOccupancy || 0), 0
  )
  const openCount = shelters.filter((s) => s.status === 'OPEN').length
  const fullCount = shelters.filter((s) => s.status === 'FULL').length
  const closedCount = shelters.filter((s) => s.status === 'CLOSED').length

  return (
    <div className="shelters-page">
      <div className="shelters-heading">
        <div>
          <p className="shelters-eyebrow">RESOURCE MANAGEMENT</p>
          <h2>Shelter Management</h2>
          <p>Manage emergency shelters, occupancy and availability.</p>
        </div>

        <div className="shelters-heading-actions">
          <button className="shelter-secondary-btn" onClick={loadShelters}>
            Refresh
          </button>
          <button className="shelter-primary-btn" onClick={openAddForm}>
            + Add Shelter
          </button>
        </div>
      </div>

      {error && <div className="shelter-message shelter-error">{error}</div>}
      {message && <div className="shelter-message shelter-success">{message}</div>}

      <div className="shelter-stats">
        <div className="shelter-stat-card">
          <span>Total Shelters</span>
          <strong>{shelters.length}</strong>
          <small>Registered locations</small>
        </div>
        <div className="shelter-stat-card">
          <span>Open</span>
          <strong>{openCount}</strong>
          <small>Accepting people</small>
        </div>
        <div className="shelter-stat-card">
          <span>Full</span>
          <strong>{fullCount}</strong>
          <small>At capacity</small>
        </div>
        <div className="shelter-stat-card">
          <span>Available Spaces</span>
          <strong>{Math.max(0, totalCapacity - totalOccupancy)}</strong>
          <small>{closedCount} closed shelters</small>
        </div>
      </div>

      <div className="shelter-capacity-card">
        <div>
          <h3>Overall Occupancy</h3>
          <p>{totalOccupancy} occupied out of {totalCapacity} total spaces</p>
        </div>
        <strong>
          {totalCapacity
            ? `${Math.round((totalOccupancy / totalCapacity) * 100)}%`
            : '0%'}
        </strong>
        <div className="shelter-progress-track">
          <div
            className="shelter-progress-fill"
            style={{
              width: `${totalCapacity
                ? Math.min(100, (totalOccupancy / totalCapacity) * 100)
                : 0}%`
            }}
          />
        </div>
      </div>

      {showForm && (
        <section className="shelter-form-card">
          <div className="shelter-form-heading">
            <div>
              <h3>{editingId ? 'Edit Shelter' : 'Add New Shelter'}</h3>
              <p>Enter the shelter details below.</p>
            </div>
            <button
              type="button"
              className="shelter-close-btn"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="shelter-form-grid">
              <label>
                Shelter Name *
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>

              <label>
                Contact Number
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  type="tel"
                />
              </label>

              <label className="shelter-full-width">
                Address *
                <input name="address" value={form.address} onChange={handleChange} required />
              </label>

              <label>
                Latitude *
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Longitude *
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Total Capacity *
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Current Occupancy *
                <input
                  name="currentOccupancy"
                  type="number"
                  min="0"
                  step="1"
                  value={form.currentOccupancy}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>

              <label className="shelter-full-width">
                Facilities
                <input
                  name="facilities"
                  value={form.facilities}
                  onChange={handleChange}
                  placeholder="Medical aid, Food, Drinking water"
                />
                <small>Separate facilities with commas.</small>
              </label>
            </div>

            <div className="shelter-form-actions">
              <button
                type="button"
                className="shelter-secondary-btn"
                onClick={() => {
                  setShowForm(false)
                  setError('')
                }}
              >
                Cancel
              </button>
              <button className="shelter-primary-btn" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Shelter'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="shelter-table-card">
        <div className="shelter-table-heading">
          <div>
            <h3>Registered Shelters</h3>
            <p>{filteredShelters.length} shelter(s) found</p>
          </div>

          <input
            className="shelter-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shelters..."
          />
        </div>

        {loading ? (
          <p className="shelter-empty">Loading shelters...</p>
        ) : filteredShelters.length === 0 ? (
          <div className="shelter-empty">
            <span>⌂</span>
            <h3>No shelters found</h3>
            <p>Add a shelter or change your search.</p>
          </div>
        ) : (
          <div className="shelter-table-scroll">
            <table className="shelter-table">
              <thead>
                <tr>
                  <th>Shelter</th>
                  <th>Location</th>
                  <th>Occupancy</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Facilities</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShelters.map((shelter) => {
                  const available = Math.max(
                    0,
                    Number(shelter.capacity || 0) -
                    Number(shelter.currentOccupancy || 0)
                  )

                  return (
                    <tr key={shelter._id}>
                      <td>
                        <strong>{shelter.name}</strong>
                        <small>{shelter.contactNumber || 'No contact number'}</small>
                      </td>
                      <td>
                        <span>{shelter.address || 'Address not provided'}</span>
                        <small>
                          {shelter.location?.latitude}, {shelter.location?.longitude}
                        </small>
                      </td>
                      <td>
                        {shelter.currentOccupancy || 0} / {shelter.capacity || 0}
                        <div className="shelter-mini-track">
                          <div
                            className="shelter-mini-fill"
                            style={{
                              width: `${shelter.capacity
                                ? Math.min(
                                    100,
                                    (shelter.currentOccupancy / shelter.capacity) * 100
                                  )
                                : 0}%`
                            }}
                          />
                        </div>
                      </td>
                      <td><strong>{available}</strong></td>
                      <td>
                        <span className={`shelter-status ${String(shelter.status || 'OPEN').toLowerCase()}`}>
                          {shelter.status || 'OPEN'}
                        </span>
                      </td>
                      <td>
                        {Array.isArray(shelter.facilities) && shelter.facilities.length
                          ? shelter.facilities.join(', ')
                          : '—'}
                      </td>
                      <td>
                        <div className="shelter-row-actions">
                          <button onClick={() => openEditForm(shelter)}>Edit</button>
                          <button onClick={() => handleToggleStatus(shelter)}>
                            {shelter.status === 'CLOSED' ? 'Reopen' : 'Close'}
                          </button>
                          <button
                            className="shelter-delete-btn"
                            onClick={() => handleDelete(shelter)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Shelters
