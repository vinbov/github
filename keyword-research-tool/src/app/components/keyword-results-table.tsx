import React from 'react';

interface KeywordResult {
  keyword: string;
  volume: number;
  competition: number;
}

interface KeywordResultsTableProps {
  results: KeywordResult[];
}

const KeywordResultsTable: React.FC<KeywordResultsTableProps> = ({ results }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Keyword</th>
            <th className="border border-gray-300 p-2">Volume</th>
            <th className="border border-gray-300 p-2">Competition</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{result.keyword}</td>
              <td className="border border-gray-300 p-2">{result.volume}</td>
              <td className="border border-gray-300 p-2">{result.competition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KeywordResultsTable;