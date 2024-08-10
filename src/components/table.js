import React, { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
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
import { useNavigate } from "react-router-dom";

const Table = () => {
    const navigate = useNavigate()
    const [allRows, setAllRows] = useState([]);
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEntityType, setSelectedEntityType] = useState(null);
    const [page, setPage] = useState(0);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [filters, setFilters] = useState({});
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [columnWidths, setColumnWidths] = useState({});

    const PAGE_SIZE = 10;
    const tableHeaderRefs = useRef([]);

    useEffect(() => {
        try {
            const savedWidths = JSON.parse(localStorage.getItem('columnWidths')) || {};
            console.log('Loaded column widths from localStorage:', savedWidths);
            setColumnWidths(savedWidths);
        } catch (err) {
            console.error("Error loading column widths from localStorage:", err);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('columnWidths', JSON.stringify(columnWidths));
    }, [columnWidths]);

    useEffect(() => {
        tableHeaderRefs.current.forEach((th, index) => {
            if (th) {
                th.style.width = `${columnWidths[index] || 100}px`; // Default width
            }
        });
    }, [columnWidths]);

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
    }, [page, sortColumn, sortDirection, filters, searchQuery]);

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

    const applySearch = (rows) => {
        if (!searchQuery) return rows;

        const lowerCaseSearchQuery = searchQuery.toLowerCase();
        return rows.filter(row => {
            return Object.values(row).some(value =>
                value.toString().toLowerCase().includes(lowerCaseSearchQuery)
            );
        });
    };

    const updatePaginatedData = (rows) => {
        const filteredData = applyFilters(rows);
        const searchedData = applySearch(filteredData);
        const sortedData = sortData(searchedData);

        if (searchedData.length === 0) {
            setData([]);
            setTotalPages(1);
            return;
        }

        const paginatedData = sortedData.slice(
            page * PAGE_SIZE,
            (page + 1) * PAGE_SIZE
        );
        setData(paginatedData);
        setTotalPages(Math.ceil(searchedData.length / PAGE_SIZE));
    };

    const handleSort = (column) => {
        const newDirection =
            sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
        setSortColumn(column);
        setSortDirection(newDirection);
        setSelectedColumn(column);
        setSelectedEntityType(column === 'entity_type' ? column : null);
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

    const groupBy = (array, key) => {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(
                currentValue
            );
            return result;
        }, {});
    };

    const prepareChartData = (data, filters, selectedColumn, selectedEntityType) => {
        let filteredData = data;

        if (filters.entity_type) {
            filteredData = data.filter(row => row.entity_type === filters.entity_type);
        }

        if (selectedEntityType) {
            filteredData = filteredData.filter(row => row.entity_type === selectedEntityType);
        }

        const groupedData = groupBy(filteredData, selectedColumn);

        const chartData = Object.entries(groupedData).map(([key, values]) => ({
            name: key,
            count: values.length
        }));

        // Handle empty data
        if (chartData.length === 0) {
            return [{ name: 'No data', count: 0 }];
        }

        return chartData;
    };

    const getChartOptions = () => {
        const chartData = prepareChartData(allRows, filters, selectedColumn, selectedEntityType);

        return {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Chart Title'
            },
            xAxis: {
                type: 'category',
                categories: chartData.map(item => item.name)
            },
            yAxis: {
                title: {
                    text: 'Count'
                }
            },
            series: [{
                name: 'Count',
                data: chartData.map(item => item.count)
            }]
        };
    };

    const [chartOptions, setChartOptions] = useState({});

    useEffect(() => {
        if (allRows.length > 0 && selectedColumn) {
            setChartOptions(getChartOptions());
        }
    }, [allRows, filters, selectedColumn]);

    const handleResizeMouseDown = (e, index) => {
        e.preventDefault();
        const th = tableHeaderRefs.current[index];
        if (!th) return;

        const startX = e.clientX;
        const startWidth = th.getBoundingClientRect().width;

        const handleMouseMove = (e) => {
            const newWidth = startWidth + (e.clientX - startX);
            setColumnWidths((prev) => {
                const updatedWidths = {
                    ...prev,
                    [index]: newWidth
                };
                console.log('Saving to localStorage:', updatedWidths);
                localStorage.setItem('columnWidths', JSON.stringify(updatedWidths)); // Save to localStorage
                return updatedWidths;
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(0);
    };


    return (
        <Container maxWidth="xl">
            <Box>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && (
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body1" color="error">
                            {error.message}
                        </Typography>
                    </Box>
                )}
                {allRows.length !== 0 && <Button
                    sx={{
                        marginRight: 2,
                        backgroundColor: "#003c4b",
                        color: "white",
                        marginTop: "60px",
                        "&:hover": {
                            backgroundColor: "#005f6b"
                        }
                    }}
                    onClick={() => navigate("/pivot_table")}
                >
                    Pivot Table
                </Button>}

                {allRows.length !== 0 && <Box mb={2} sx={{ display: "flex", eidth: "30px", justifyContent: "end" }}>
                    <TextField
                        label="Search"
                        variant="outlined"
                        fullWidth
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{ width: "300px" }}
                    />
                </Box>}
                <TableContainer component={Paper} sx={{ marginBottom: 2, marginTop: "60px", borderRadius: "20px" }}>
                    <MuiTable>
                        <TableHead sx={{ background: "#003c4b " }}>
                            <TableRow>
                                {allRows.length > 0 ? (
                                    Object.keys(allRows[0] || {}).map((key, index) => (
                                        <TableCell
                                            key={index}
                                            ref={(el) => (tableHeaderRefs.current[index] = el)}
                                            style={{
                                                width: `${columnWidths[index] || 100}px`, fontWeight: 600,
                                                fontSize: "16px",
                                                cursor: "pointer",
                                                color: "white"
                                            }}// Default width
                                        >
                                            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <Typography
                                                    onClick={() => handleSort(key)} sx={{ flex: 1 }}>
                                                    {key}
                                                </Typography>
                                                <Box
                                                    className="resize-handle"
                                                    onMouseDown={(e) => handleResizeMouseDown(e, index)}
                                                    sx={{
                                                        position: 'absolute',
                                                        right: 0,
                                                        top: 0,
                                                        height: '100%',
                                                        width: '5px',
                                                        cursor: 'ew-resize',
                                                        zIndex: 1,
                                                        color: "white"
                                                    }}
                                                />
                                            </Box>
                                            <TextField
                                                placeholder={`Filter by ${key}`}
                                                size="small"
                                                variant="outlined"
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
                                        </TableCell>
                                    ))
                                ) : (
                                    <TableCell colSpan={1}>
                                        <Typography variant="body1">No headers available</Typography>
                                    </TableCell>
                                )}
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
                                                    sx={{ width: columnWidths[index] || "100px" }}
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
                                            No data available
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </MuiTable>
                </TableContainer>
                {!loading && !error && selectedColumn && (
                    <HighchartsReact
                        highcharts={Highcharts}
                        constructorType="chart"
                        options={chartOptions}
                    />
                )}
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
