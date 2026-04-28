import { useMemo, useState } from "react";
import { Modal, OverlayTrigger, Tab, Tabs, Tooltip } from "react-bootstrap";
import { useHotelContext } from "../../../context/HotelContext";

function getStatusBadgeClass(status) {
  if (status === "available") return "badge-success";
  if (status === "occupied") return "badge-primary";
  if (status === "reserved") return "badge-warning";
  return "badge-danger";
}

function createRoomTypeFormState(selectedHotelId) {
  return {
    hotelId: selectedHotelId,
    code: "",
    title: "",
    description: "",
    imageUrl: "",
    formImageUrl: "",
    sizeLabel: "",
    bedLabel: "",
    bestFor: "",
    rateLabel: "",
    rateNote: "",
    displayOrder: 0,
    maxAdults: 1,
    maxChildren: 0,
    baseRate: 0,
    amenities: "",
    galleryImages: [],
    isActive: true,
  };
}

function createRoomFormState(selectedHotelId) {
  return {
    hotelId: selectedHotelId,
    roomTypeId: "",
    roomCode: "",
    floor: "",
    occupancy: 1,
    status: "available",
    housekeeping: "Clean",
  };
}

function normalizeFiles(fileList) {
  return Array.from(fileList ?? []).filter(Boolean);
}

function buildRoomTypePayload(formState) {
  return {
    ...formState,
    amenities: String(formState.amenities ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    galleryImages: (formState.galleryImages ?? []).map((item, index) => ({
      image: item.image,
      alt: item.alt ?? `${formState.title || "Room"} photo ${index + 1}`,
      displayOrder: item.displayOrder ?? index + 1,
    })),
    displayOrder: Number(formState.displayOrder),
    maxAdults: Number(formState.maxAdults),
    maxChildren: Number(formState.maxChildren),
    baseRate: Number(formState.baseRate),
  };
}

function MediaPreview({ image, label }) {
  if (!image) {
    return (
      <div className="border rounded p-3 text-muted text-center h-100">
        {label} not uploaded yet
      </div>
    );
  }

  return (
    <div className="border rounded overflow-hidden h-100">
      <img src={image} alt={label} className="w-100" style={{ height: 150, objectFit: "cover" }} />
      <div className="p-2 small text-muted">{label}</div>
    </div>
  );
}

export default function RoomsPage() {
  const {
    roomRecords,
    roomTypeRecords,
    selectedHotelId,
    actionState,
    createRoomType,
    editRoomType,
    deleteRoomType,
    uploadRoomTypeImages,
    createRoom,
    editRoom,
    deleteRoom,
  } = useHotelContext();
  const [activeTab, setActiveTab] = useState("room-types");
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomTypeFormState, setRoomTypeFormState] = useState(() => createRoomTypeFormState(selectedHotelId));
  const [roomFormState, setRoomFormState] = useState(() => createRoomFormState(selectedHotelId));
  const [uploadState, setUploadState] = useState({ hero: [], form: [], gallery: [] });

  const totalStoredImagesByRoomType = useMemo(
    () =>
      Object.fromEntries(
        roomTypeRecords.map((roomType) => [
          roomType.id,
          Number(Boolean(roomType.imageUrl)) + Number(Boolean(roomType.formImageUrl)) + (roomType.galleryImages?.length ?? 0),
        ]),
      ),
    [roomTypeRecords],
  );

  function resetRoomTypeForm() {
    setEditingRoomTypeId(null);
    setRoomTypeFormState(createRoomTypeFormState(selectedHotelId));
    setUploadState({ hero: [], form: [], gallery: [] });
    setIsRoomTypeModalOpen(false);
  }

  function resetRoomForm() {
    setEditingRoomId(null);
    setRoomFormState(createRoomFormState(selectedHotelId));
    setIsRoomModalOpen(false);
  }

  function updateRoomTypeField(field, value) {
    setRoomTypeFormState((current) => ({ ...current, [field]: value }));
  }

  function updateRoomField(field, value) {
    setRoomFormState((current) => ({ ...current, [field]: value }));
  }

  function startCreateRoomType() {
    setEditingRoomTypeId(null);
    setRoomTypeFormState(createRoomTypeFormState(selectedHotelId));
    setUploadState({ hero: [], form: [], gallery: [] });
    setIsRoomTypeModalOpen(true);
  }

  function startRoomTypeEdit(roomType) {
    setEditingRoomTypeId(roomType.id);
    setRoomTypeFormState({
      hotelId: selectedHotelId,
      code: roomType.code ?? "",
      title: roomType.title ?? "",
      description: roomType.description ?? "",
      imageUrl: roomType.imageUrl ?? "",
      formImageUrl: roomType.formImageUrl ?? "",
      sizeLabel: roomType.sizeLabel ?? "",
      bedLabel: roomType.bedLabel ?? "",
      bestFor: roomType.bestFor ?? "",
      rateLabel: roomType.rateLabel ?? "",
      rateNote: roomType.rateNote ?? "",
      displayOrder: roomType.displayOrder ?? 0,
      maxAdults: roomType.maxAdults ?? 1,
      maxChildren: roomType.maxChildren ?? 0,
      baseRate: roomType.baseRate ?? 0,
      amenities: (roomType.amenities ?? []).join(", "),
      galleryImages: (roomType.galleryImages ?? []).map((item) => ({
        image: item.image,
        alt: item.alt,
        displayOrder: item.displayOrder,
      })),
      isActive: roomType.isActive ?? true,
    });
    setUploadState({ hero: [], form: [], gallery: [] });
    setIsRoomTypeModalOpen(true);
  }

  function startCreateRoom() {
    setEditingRoomId(null);
    setRoomFormState(createRoomFormState(selectedHotelId));
    setIsRoomModalOpen(true);
  }

  function startRoomEdit(room) {
    setEditingRoomId(room.id);
    setRoomFormState({
      hotelId: selectedHotelId,
      roomTypeId: room.roomTypeId ?? "",
      roomCode: room.roomCode ?? "",
      floor: room.floor ?? "",
      occupancy: room.occupancy ?? 1,
      status: room.status ?? "available",
      housekeeping: room.housekeeping ?? "Clean",
    });
    setIsRoomModalOpen(true);
  }

  async function applyQueuedUploads(targetRoomTypeId, baseState) {
    let nextState = {
      ...baseState,
      galleryImages: [...(baseState.galleryImages ?? [])],
    };

    if (uploadState.hero.length) {
      const heroImages = await uploadRoomTypeImages(targetRoomTypeId, "hero", uploadState.hero);
      if (heroImages[0]?.image) {
        nextState.imageUrl = heroImages[0].image;
      }
    }

    if (uploadState.form.length) {
      const formImages = await uploadRoomTypeImages(targetRoomTypeId, "form", uploadState.form);
      if (formImages[0]?.image) {
        nextState.formImageUrl = formImages[0].image;
      }
    }

    if (uploadState.gallery.length) {
      const galleryUploads = await uploadRoomTypeImages(targetRoomTypeId, "gallery", uploadState.gallery);
      nextState.galleryImages = [
        ...nextState.galleryImages,
        ...galleryUploads.map((item, index) => ({
          image: item.image,
          alt: item.alt,
          displayOrder: nextState.galleryImages.length + index + 1,
        })),
      ];
    }

    return nextState;
  }

  async function handleRoomTypeSubmit(event) {
    event.preventDefault();

    const basePayload = buildRoomTypePayload(roomTypeFormState);
    let targetRoomTypeId = editingRoomTypeId;
    let nextPayload = { ...basePayload };

    if (editingRoomTypeId) {
      await editRoomType(editingRoomTypeId, basePayload);
    } else {
      const result = await createRoomType(basePayload);
      targetRoomTypeId = result?.roomTypeId ?? null;
    }

    if (targetRoomTypeId && (uploadState.hero.length || uploadState.form.length || uploadState.gallery.length)) {
      nextPayload = await applyQueuedUploads(targetRoomTypeId, nextPayload);
      await editRoomType(targetRoomTypeId, buildRoomTypePayload(nextPayload));
    }

    resetRoomTypeForm();
  }

  async function handleRoomSubmit(event) {
    event.preventDefault();

    const payload = {
      ...roomFormState,
      occupancy: Number(roomFormState.occupancy),
    };

    if (editingRoomId) {
      await editRoom(editingRoomId, payload);
    } else {
      await createRoom(payload);
    }

    resetRoomForm();
  }

  function removeGalleryImage(indexToRemove) {
    setRoomTypeFormState((current) => ({
      ...current,
      galleryImages: (current.galleryImages ?? [])
        .filter((_, index) => index !== indexToRemove)
        .map((item, index) => ({ ...item, displayOrder: index + 1 })),
    }));
  }

  return (
    <div className="card">
      <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between gap-3">
        <div>
          <h4 className="card-title mb-1">Rooms & Inventory</h4>
          <p className="mb-0">Manage room types, physical rooms, and uploaded media from a cleaner operations workflow.</p>
        </div>
        <div className="d-flex gap-2">
          <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-add-room-type">Add room type</Tooltip>}>
            <button type="button" className="btn btn-primary" onClick={startCreateRoomType}>
              <i className="fa fa-layer-group" />
            </button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-add-room">Add physical room</Tooltip>}>
            <button type="button" className="btn btn-outline-primary" onClick={startCreateRoom}>
              <i className="fa fa-door-open" />
            </button>
          </OverlayTrigger>
        </div>
      </div>
      <div className="card-body">
        {actionState.status === "error" ? <div className="alert alert-warning">{actionState.error}</div> : null}

        <Tabs activeKey={activeTab} onSelect={(key) => setActiveTab(key ?? "room-types")} className="mb-4">
          <Tab eventKey="room-types" title="Room Types">
            <div className="table-responsive">
              <table className="table card-table default-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Rate</th>
                    <th>Capacity</th>
                    <th>Amenities</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypeRecords.map((roomType) => (
                    <tr key={roomType.id}>
                      <td>
                        <strong>{roomType.title}</strong>
                        <div className="text-muted">{roomType.code}</div>
                      </td>
                      <td>
                        <strong>${roomType.baseRate}</strong>
                        <div className="text-muted">{roomType.rateLabel || "Standard rate"}</div>
                      </td>
                      <td>{roomType.maxAdults} adult / {roomType.maxChildren} child</td>
                      <td>
                        <div className="text-muted">{(roomType.amenities ?? []).slice(0, 3).join(", ") || "No amenities listed"}</div>
                        <small>{totalStoredImagesByRoomType[roomType.id] ?? 0} stored media item(s)</small>
                      </td>
                      <td>
                        <span className={`badge light ${roomType.isActive ? "badge-success" : "badge-secondary"}`}>
                          {roomType.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn btn-sm btn-info light" onClick={() => startRoomTypeEdit(roomType)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteRoomType(roomType.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tab>

          <Tab eventKey="rooms" title="Rooms">
            <div className="table-responsive">
              <table className="table card-table default-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Floor</th>
                    <th>Occupancy</th>
                    <th>Housekeeping</th>
                    <th>Status</th>
                    <th>Linked reservation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roomRecords.map((room) => (
                    <tr key={room.id}>
                      <td><strong>{room.roomCode}</strong></td>
                      <td>{room.roomType}</td>
                      <td>{room.floor}</td>
                      <td>{room.occupancy} guest{room.occupancy === 1 ? "" : "s"}</td>
                      <td>{room.housekeeping}</td>
                      <td>
                        <span className={`badge light ${getStatusBadgeClass(room.status)}`} style={{ textTransform: "capitalize" }}>
                          {room.status}
                        </span>
                      </td>
                      <td>{room.activeReservation?.id ?? "Open inventory"}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn btn-sm btn-info light" onClick={() => startRoomEdit(room)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteRoom(room.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tab>
        </Tabs>
      </div>

      <Modal show={isRoomTypeModalOpen} onHide={resetRoomTypeForm} size="xl" centered>
        <form onSubmit={handleRoomTypeSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingRoomTypeId ? "Edit room type" : "Add room type"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-lg-8">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Code</label>
                    <input className="form-control" value={roomTypeFormState.code} onChange={(event) => updateRoomTypeField("code", event.target.value)} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Title</label>
                    <input className="form-control" value={roomTypeFormState.title} onChange={(event) => updateRoomTypeField("title", event.target.value)} required />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="3" value={roomTypeFormState.description} onChange={(event) => updateRoomTypeField("description", event.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Size label</label>
                    <input className="form-control" value={roomTypeFormState.sizeLabel} onChange={(event) => updateRoomTypeField("sizeLabel", event.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Bed label</label>
                    <input className="form-control" value={roomTypeFormState.bedLabel} onChange={(event) => updateRoomTypeField("bedLabel", event.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Best for</label>
                    <input className="form-control" value={roomTypeFormState.bestFor} onChange={(event) => updateRoomTypeField("bestFor", event.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Rate label</label>
                    <input className="form-control" value={roomTypeFormState.rateLabel} onChange={(event) => updateRoomTypeField("rateLabel", event.target.value)} />
                  </div>
                  <div className="col-md-8 mb-3">
                    <label className="form-label">Rate note</label>
                    <input className="form-control" value={roomTypeFormState.rateNote} onChange={(event) => updateRoomTypeField("rateNote", event.target.value)} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Base rate</label>
                    <input type="number" min="0" className="form-control" value={roomTypeFormState.baseRate} onChange={(event) => updateRoomTypeField("baseRate", event.target.value)} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Adults</label>
                    <input type="number" min="1" className="form-control" value={roomTypeFormState.maxAdults} onChange={(event) => updateRoomTypeField("maxAdults", event.target.value)} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Children</label>
                    <input type="number" min="0" className="form-control" value={roomTypeFormState.maxChildren} onChange={(event) => updateRoomTypeField("maxChildren", event.target.value)} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Display order</label>
                    <input type="number" min="0" className="form-control" value={roomTypeFormState.displayOrder} onChange={(event) => updateRoomTypeField("displayOrder", event.target.value)} />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Amenities</label>
                    <input className="form-control" value={roomTypeFormState.amenities} onChange={(event) => updateRoomTypeField("amenities", event.target.value)} placeholder="Free WiFi, Microwave, Refrigerator" />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Hero image</label>
                    <input type="file" className="form-control" accept="image/*" onChange={(event) => setUploadState((current) => ({ ...current, hero: normalizeFiles(event.target.files) }))} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Form image</label>
                    <input type="file" className="form-control" accept="image/*" onChange={(event) => setUploadState((current) => ({ ...current, form: normalizeFiles(event.target.files) }))} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Gallery images</label>
                    <input type="file" className="form-control" accept="image/*" multiple onChange={(event) => setUploadState((current) => ({ ...current, gallery: normalizeFiles(event.target.files) }))} />
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="mb-3">
                  <h6 className="mb-2">Stored media</h6>
                  <div className="row g-3">
                    <div className="col-12">
                      <MediaPreview image={roomTypeFormState.imageUrl} label="Hero image" />
                    </div>
                    <div className="col-12">
                      <MediaPreview image={roomTypeFormState.formImageUrl} label="Form image" />
                    </div>
                  </div>
                </div>
                <div>
                  <h6 className="mb-2">Gallery</h6>
                  {(roomTypeFormState.galleryImages ?? []).length ? (
                    <div className="row g-2">
                      {roomTypeFormState.galleryImages.map((image, index) => (
                        <div className="col-6" key={`${image.image}-${index}`}>
                          <div className="border rounded overflow-hidden">
                            <img src={image.image} alt={image.alt || `Gallery ${index + 1}`} className="w-100" style={{ height: 110, objectFit: "cover" }} />
                            <div className="p-2 d-flex justify-content-between align-items-center">
                              <small className="text-muted">Photo {index + 1}</small>
                              <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => removeGalleryImage(index)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded p-3 text-muted text-center">No gallery images yet.</div>
                  )}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-light" onClick={resetRoomTypeForm}>
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              {editingRoomTypeId ? "Save room type" : "Create room type"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal show={isRoomModalOpen} onHide={resetRoomForm} centered>
        <form onSubmit={handleRoomSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingRoomId ? "Edit room" : "Add room"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Room type</label>
                <select className="form-control" value={roomFormState.roomTypeId} onChange={(event) => updateRoomField("roomTypeId", event.target.value)} required>
                  <option value="">Choose room type</option>
                  {roomTypeRecords.map((roomType) => (
                    <option key={roomType.id} value={roomType.id}>
                      {roomType.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Room code</label>
                <input className="form-control" value={roomFormState.roomCode} onChange={(event) => updateRoomField("roomCode", event.target.value)} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Floor</label>
                <input className="form-control" value={roomFormState.floor} onChange={(event) => updateRoomField("floor", event.target.value)} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Occupancy</label>
                <input type="number" min="1" className="form-control" value={roomFormState.occupancy} onChange={(event) => updateRoomField("occupancy", event.target.value)} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Status</label>
                <select className="form-control" value={roomFormState.status} onChange={(event) => updateRoomField("status", event.target.value)}>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="blocked">Blocked</option>
                  <option value="out_of_service">Out of service</option>
                </select>
              </div>
              <div className="col-md-12 mb-0">
                <label className="form-label">Housekeeping status</label>
                <input className="form-control" value={roomFormState.housekeeping} onChange={(event) => updateRoomField("housekeeping", event.target.value)} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-light" onClick={resetRoomForm}>
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              {editingRoomId ? "Save room" : "Create room"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
