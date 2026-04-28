import React, { useState } from 'react';
import {Link} from 'react-router-dom';
import { Modal, Form } from "react-bootstrap";

import BookingSlider from './GuestDetail/BookingSlider';
import HistoryBooking from './GuestDetail/HistoryBooking';
///Images
import profile10 from './../../../assets/images/profile/10.jpg';

const GuestDetail = () =>{
	const [report, setReport] = useState(false);
	const [filter, setFilter] = useState(false);
	return(
		<>
			<div className="row">
				<div className="col-xl-9 col-xxl-8">
					<div className="card">	
						<div className="card-header border-0 pb-0">
							<h4 className="card-title">Current Booking</h4>
						</div>
						<div className="card-body">
							<BookingSlider />
							<div className="d-flex mt-4 flex-wrap">
								<h4 className="card-title me-auto">Room Facilities</h4>
								<h5 className="card-title">AC, Shower, Double Bed, Towel, Bathup, Coffee Set, LED TV, Wifi</h5>
							</div>
						</div>
						<div className="card-body d-flex pt-0 align-items-center flex-wrap">
							<div className="d-flex align-items-center me-5 pe-4 mb-xxl-0 mb-2">
								<span className="key-icon me-3">
									<svg width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path fillRule="evenodd" clipRule="evenodd" d="M16.1585 6.41671C16.8932 2.80354 20.0899 0.0833735 23.9168 0.0833737C28.2868 0.0833739 31.8335 3.63004 31.8335 8.00004C31.8335 12.3685 28.2868 15.9167 23.9168 15.9167C20.0899 15.9167 16.8932 13.195 16.1585 9.58337L9.66683 9.58337L9.66683 12.75C9.66683 13.6225 8.9575 14.3334 8.0835 14.3334C7.2095 14.3334 6.50016 13.6225 6.50016 12.75L6.50016 9.58337L3.3335 9.58337L3.3335 12.75C3.3335 13.6225 2.62416 14.3334 1.75016 14.3334C0.876161 14.3334 0.166828 13.6225 0.166828 12.75L0.166828 8.00004C0.166828 7.12446 0.876162 6.41671 1.75016 6.41671L16.1585 6.41671ZM28.6668 8.00004C28.6668 10.6205 26.5388 12.75 23.9168 12.75C21.2948 12.75 19.1668 10.6205 19.1668 8.00004C19.1668 5.37804 21.2948 3.25004 23.9168 3.25004C26.5388 3.25004 28.6668 5.37804 28.6668 8.00004Z" fill="white"/>
									</svg>
								</span>
								<div>
									<h5 className="text-primary">Booking ID #0052466623</h5>
									<h4 className="card-title mb-0">King Deluxe B-23</h4>
								</div>
							</div>
							<div className="d-sm-flex d-block align-items-center">
								<div className="me-5 mb-sm-0 mb-3">
									<p className="mb-2"><i className="far fa-user scale3 me-3"></i>Room Capacity</p>
									<h4 className="mb-0 card-title">3-5 Person</h4>
								</div>
								<div className="me-5 mb-sm-0 mb-3">
									<p className="mb-2"><i className="fas fa-bed scale3 me-3"></i>Bed Type</p>
									<h4 className="mb-0 card-title">Double</h4>
								</div>
								<div>
									<p className="mb-2"><i className="far fa-calendar-minus scale3 me-3"></i>Booking Date</p>
									<h4 className="mb-0 card-title">Oct 25th - 28th, 2024</h4>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-4">
					<div className="card profile-card">
						<div className="card-body">
							<div className="d-flex align-items-center">
								<img src={profile10} alt="" className="rounded profile-img me-4" />
								<div>
									<h5 className="text-primary">#GS-2234</h5>
									<h4 className="mb-0">Louis Khan</h4>
								</div>
							</div>
							<div className="row mt-4 pt-3">
								<div className="col-8">
									<Link to={"#"} className="btn btn-dark light btn-block">Edit Profile</Link>
								</div>
								<div className="col-4">
									<Link to={"#"} className="btn btn-danger btn-block"><i className="far fa-times-circle scale3"></i></Link>
								</div>
							</div>
							<ul className="user-info-list">
								<li>
									<i className="fas fa-phone-volume"></i>
									<span>+12 3456 678</span>
								</li>
								<li>
									<i className="far fa-envelope"></i>
									<span className="overflow-hidden">louiskhan002@mail.com</span>
								</li>
								<li>
									<i className="fas fa-map-marker-alt"></i>
									<span>New Avenue Street Corner South London 224151</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div className="col-xl-12">
					<div className="d-flex align-items-center rooms flex-wrap">
						<h4 className="me-auto mb-3">History Booking Details</h4>
						<div className="mb-3">
							<Link to={"#"} className="btn btn-primary me-3" onClick={()=>setFilter(true)}><i className="fas fa-calendar-times me-2" /> Date Filter</Link>
							<Link to={"#"} className="btn btn-primary" onClick={()=>setReport(true)}><i className="far fa-file-word me-2" />Generate Report</Link>	
						</div>
					</div>
					<HistoryBooking />
				</div>	
			</div>	
			<Modal className="modal fade" id="exampleModal" show={report} onHide={setReport} centered>				
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5">History Booking Details</h1>
						<button type="button" className="btn-close" onClick={()=>setReport(false)}></button>
					</div>
					<div className="modal-body">
						<div className="row">
							<div className="col-xl-12">
								<div className="mb-3">
									<label for="exampleFormControlInput1" className="form-label">Room Facility</label>
						  			<input type="text" className="form-control" id="exampleFormControlInput1" placeholder="AC, Shower, Double Bed, Towel, Bathup,Coffee Set, LED TV, Wifi" />
								</div>
							</div>
							<div className="col-xl-6">
								<label className="form-label d-block">Status</label>								
								<Form.Select className='form-control'>									
									<option selected>Cancelled</option>
									<option value="1">Pending</option>
									<option value="2">Cancelled</option>
									<option value="3">Refund</option>
									<option value="4">Booked</option>
								</Form.Select>
							</div>
							<div className="col-xl-6">
								<div className="mb-3">
									<label for="exampleFormControlInput2" className="form-label">Room Name</label>
									<input type="text" className="form-control" id="exampleFormControlInput2" placeholder="Queen A-0001" />
								</div>								
							</div>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-danger light" onClick={()=>setReport(false)}>Close</button>
						<button type="button" className="btn btn-primary">Save changes</button>
					</div>
				</div>				
			</Modal>
			<Modal className="modal fade" id="exampleModal" show={filter} onHide={setFilter} centered>				
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5">Filter Details</h1>
						<button type="button" className="btn-close" onClick={()=>setFilter(false)}></button>
					</div>
					<div className="modal-body">
						<div className="row">
							<div className="col-xl-12">
								<label className="form-label d-block">Status</label>								
								<Form.Select className='form-control'>									
									<option selected>Cancelled</option>
									<option value="1">Pending</option>
									<option value="2">Cancelled</option>
									<option value="3">Refund</option>
									<option value="4">Booked</option>
								</Form.Select>								
							</div>
							<div className="col-xl-6">
								<div className="my-3">
									<label htmlfor="exampleFormControlInput2" className="form-label">Room Name</label>
									<input type="text" className="form-control" id="exampleFormControlInput2" placeholder="Queen A-0001" />
								</div>	
							</div>
							<div className="col-xl-6">
								<div className="my-3">
									<label className="form-label">Book Date</label>
									<input type="date" className="form-control" />
								</div>								
							</div>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-danger light" onClick={()=>setFilter(false)}>Close</button>
						<button type="button" className="btn btn-primary">Save changes</button>
					</div>
				</div>				
			</Modal>	
		</>
	)
}
export default GuestDetail;