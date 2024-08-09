import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
    Box,
    CircularProgress,
    Typography,
    TableContainer,
    Paper,
    Table as MuiTable,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Container,
    TextField,
} from "@mui/material";
import { format } from "date-fns";

const Table = () => {
    const [allRows, setAllRows] = useState([]);
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [filters, setFilters] = useState({});

    const PAGE_SIZE = 10;

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
                        updatePaginatedData(rows);
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
    }, []);

    useEffect(() => {
        updatePaginatedData(allRows);
    }, [page, sortColumn, sortDirection, filters]);

    const applyFilters = (rows) => {
        return rows.filter((row) => {
            return Object.keys(filters).every((key) => {
                const filterValue = filters[key]?.toLowerCase();
                const cellValue = row[key]?.toLowerCase() || "";
                return cellValue.includes(filterValue) || !filterValue;
            });
        });
    };

    const sortData = (rows) => {
        if (!sortColumn) return rows;
        return [...rows].sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    };

    const updatePaginatedData = (rows) => {
        const filteredData = applyFilters(rows);
        const sortedData = sortData(filteredData);

        if (filteredData.length === 0) {
            setData([]);
            setTotalPages(1);
            return;
        }

        const paginatedData = sortedData.slice(
            page * PAGE_SIZE,
            (page + 1) * PAGE_SIZE
        );
        setData(paginatedData);
        setTotalPages(Math.ceil(filteredData.length / PAGE_SIZE));

        console.log("All Rows:", allRows);
        console.log("Filtered Data:", filteredData);
        console.log("Sorted Data:", sortedData);
        console.log("Paginated Data:", paginatedData);
    };

    const handleSort = (column) => {
        const newDirection =
            sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
        setSortColumn(column);
        setSortDirection(newDirection);
        updatePaginatedData(allRows);
    };

    const handleFilterChange = (e, column) => {
        setFilters((prev) => ({
            ...prev,
            [column]: e.target.value,
        }));
        setPage(0);
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const handleNextPage = () => {
        setPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    };

    const handleInputChange = (e, rowIndex, key) => {
        const updatedValue = e.target.value;

        const updatedData = [...data];
        updatedData[rowIndex][key] = updatedValue;
        setData(updatedData);

        const globalRowIndex = page * PAGE_SIZE + rowIndex;
        const updatedAllRows = [...allRows];
        updatedAllRows[globalRowIndex][key] = updatedValue;
        setAllRows(updatedAllRows);
    };

    const formatDate = (dateStr) => {
        try {
            const parsedDate = new Date(dateStr);
            return format(parsedDate, "dd/MM/yyyy");
        } catch {
            return dateStr; // Fallback in case of parsing error
        }
    };

    return (
        <Container maxWidth="xl">
            <Box>
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
                <Typography></Typography>
                <TableContainer component={Paper} sx={{ marginBottom: 2, marginTop: "60px", borderRadius: "20px" }}>
                    <MuiTable>
                        <TableHead sx={{ background: "#003c4b " }}>
                            <TableRow>
                                {Object.keys(allRows[0] || {}).map((key) => (
                                    <TableCell
                                        key={key}
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: "16px",
                                            cursor: "pointer",
                                            color: "white"
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "block",
                                                gap: "10px",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span onClick={() => handleSort(key)}>{key}</span>
                                            {sortColumn === key ? (
                                                sortDirection === "asc" ? (
                                                    "🔼"
                                                ) : (
                                                    "🔽"
                                                )
                                            ) : null}
                                            <TextField
                                                variant="outlined"
                                                size="small"
                                                placeholder={`Filter ${key}`}
                                                value={filters[key] || ""}
                                                onChange={(e) => handleFilterChange(e, key)}
                                                InputProps={{
                                                    style: {
                                                        padding: "0 5px",
                                                        color: "white",
                                                        border: "1px solid white",
                                                        marginTop: "10px"
                                                    },
                                                }}
                                                sx={{ marginLeft: "0px", width: "100px" }}
                                            />
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {Object.keys(row).map((key, index) => (
                                            <TableCell key={index}>
                                                <TextField
                                                    variant="outlined"
                                                    size="small"
                                                    value={
                                                        key === "created_dt" || key === "data_source_modified_dt"
                                                            ? formatDate(row[key])
                                                            : row[key]
                                                    }
                                                    onChange={(e) => handleInputChange(e, rowIndex, key)}
                                                    InputProps={{
                                                        style: {
                                                            padding: "0 1px",
                                                            fontSize: "10px"
                                                        },
                                                    }}
                                                    sx={{ width: "100px" }}
                                                    className="input_field"
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={Object.keys(allRows[0] || {}).length} align="center">
                                        <Typography variant="body1" sx={{ padding: 2 }}>
                                            Please wait
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </MuiTable>
                </TableContainer>

                {!loading && !error && (
                    <Box
                        sx={{ display: "flex", justifyContent: "end", alignItems: "center" }}
                    >
                        <Button
                            variant="contained"
                            onClick={handlePreviousPage}
                            disabled={page === 0}
                            sx={{
                                marginRight: 2,
                                backgroundColor: "#003c4b",
                                "&:hover": {
                                    backgroundColor: "#005f6b"
                                }
                            }}
                        >
                            Previous
                        </Button>
                        <Typography variant="body1">
                            Page {page + 1} of {totalPages}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleNextPage}
                            disabled={page === totalPages - 1}
                            sx={{
                                marginLeft: 2,
                                backgroundColor: "#003c4b",
                                "&:hover": {
                                    backgroundColor: "#005f6b"
                                }
                            }}
                        >
                            Next
                        </Button>

                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default Table;
