import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const Cars = () => {
    const { showToast } = useToast();
    const [cars, setCars] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCar, setCurrentCar] = useState(null);

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            const response = await api.get('/cars');
            setCars(response.data);
        } catch (error) {
            console.error('Error fetching cars:', error);
            // alert('Failed to fetch cars');
        }
    };

    const handleEdit = (car) => {
        setCurrentCar(car);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentCar.carId) {
                await api.put(`/cars/${currentCar.carId}`, currentCar);
            } else {
                await api.post('/cars', currentCar);
            }
            setIsModalOpen(false);
            fetchCars();
        } catch (error) {
            console.error('Error saving car:', error);
            showToast('Failed to save car', 'error');
        }
    };

    const columns = [
        { key: 'make', label: 'Make' },
        { key: 'model', label: 'Model' },
        { key: 'variant', label: 'Variant' },
        {
            key: 'actions', label: 'Actions', render: (row) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                    }}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded-md text-sm border border-blue-200"
                    title="Edit Car"
                >
                    <Edit size={16} />
                </button>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Cars</h1>
                <button
                    onClick={() => { setCurrentCar({}); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add Car
                </button>
            </div>

            <Table columns={columns} data={cars} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentCar?.carId ? 'Edit Car' : 'Add Car'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Make</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentCar?.make || ''}
                            onChange={(e) => setCurrentCar({ ...currentCar, make: e.target.value })}
                            required
                            minLength={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Model</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentCar?.model || ''}
                            onChange={(e) => setCurrentCar({ ...currentCar, model: e.target.value })}
                            required
                            minLength={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Variant</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentCar?.variant || ''}
                            onChange={(e) => setCurrentCar({ ...currentCar, variant: e.target.value })}
                        />
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Cars;
