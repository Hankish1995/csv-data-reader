import './App.css';
import Table from './components/table';
import PivotTable from './components/pivot_table';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Table />} />
          <Route path="/pivot_table" element={<PivotTable />} />

        </Routes>
      </BrowserRouter>
      {/* <Table /> */}
      {/* <PivotTable /> */}
    </div>
  );
}

export default App;
