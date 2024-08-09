import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const Table = () => {
    const [allRows, setAllRows] = useState([]);
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0); // Track current page

    const PAGE_SIZE = 10; // Define how many records per page

    useEffect(() => {
        const fetchCsvData = async () => {
            try {
                const response = await fetch("/data.csv");
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    complete: (result) => {
                        const rows = result.data;
                        setAllRows(rows);
                        setTotalPages(Math.ceil(rows.length / PAGE_SIZE));
                        const paginatedData = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
                        setData(paginatedData);
                        setLoading(false);
                    },
                    error: (err) => {
                        setError(err);
                        setLoading(false);
                    },
                });
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };

        fetchCsvData();
    }, [page]); // Re-fetch data when `page` changes

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const handleNextPage = () => {
        setPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    };

    return (
        <div>
            <h1>This is the Table Section</h1>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}
            {!loading && !error && (
                <>
                    <table border="1" cellPadding="10">
                        <thead>
                            <tr>
                                {data.length > 0 && Object.keys(data[0]).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {Object.values(row).map((value, index) => (
                                        <td key={index}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={handlePreviousPage} disabled={page === 0}>
                            Previous
                        </button>
                        <span style={{ margin: '0 10px' }}>
                            Page {page + 1} of {totalPages}
                        </span>
                        <button onClick={handleNextPage} disabled={page === totalPages - 1}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Table;
