import React, { useEffect, useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Box, Typography, CircularProgress } from '@mui/material';

const PivotTable = () => {
    const [allRows, setAllRows] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    const gridRef = useRef(null);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        console.log("Selected date:", date);
    };

    const PAGE_SIZE = 15; // Define how many records per page

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
                        setData(rows); // Set all data here
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
    }, []); // Fetch data once on component mount

    // Function to save column state to localStorage
    const saveColumnState = (columnState) => {
        localStorage.setItem('columnState', JSON.stringify(columnState));
    };

    // Function to get column state from localStorage
    const getSavedColumnState = () => {
        const savedState = localStorage.getItem('columnState');
        return savedState ? JSON.parse(savedState) : [];
    };

    const columnDefs = useMemo(() =>
        Object.keys(data[0] || {}).map((key) => ({
            headerName: key,
            field: key,
            sortable: true,
            filter: true,
            flex: 1, // Allow column to grow and shrink
        }))
        , [data]);

    const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
    const gridStyle = useMemo(() => ({ height: "calc(100vh - 200px)", width: "100%" }), []);
    const defaultColDef = useMemo(() => ({
        minWidth: 200,
        maxWidth: 300,
        flex: 1,
        filter: true,
    }), []);

    // Handle column resize and save the new state
    const onColumnResized = (params) => {
        if (params.finished) {
            const columnState = params.api.getColumnState();
            saveColumnState(columnState);
        }
    };

    // Restore column state when the grid is ready
    const onGridReady = (params) => {
        gridRef.current = params.api;
        const savedState = getSavedColumnState();
        params.api.applyColumnState({ state: savedState, applyOrder: true });
    };

    return (
        <Box>
            <Box sx={{ padding: 3 }}>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", marginY: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Typography color="error" variant="body1">
                        Error: {error.message}
                    </Typography>
                )}

                {!loading && !error && (
                    <>
                        <div style={containerStyle}>
                            <div
                                className={"ag-theme-alpine"} // Ensure correct theme is applied
                                style={gridStyle}
                            >
                                <AgGridReact
                                    columnDefs={columnDefs}
                                    rowData={data}
                                    pagination={true}
                                    paginationPageSize={PAGE_SIZE}
                                    domLayout='autoHeight'
                                    defaultColDef={defaultColDef}
                                    suppressPaginationPanel={false} // Ensure pagination panel is shown
                                    onColumnResized={onColumnResized} // Save state on resize
                                    onGridReady={onGridReady} // Restore saved column state
                                />
                            </div>
                        </div>
                    </>
                )}
            </Box>
        </Box>
    );

};

export default PivotTable;
