import { useState } from 'react';
import Card from '../components/Card';
import { jsPDF } from 'jspdf';

const Assignments = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [uploadHistory, setUploadHistory] = useState([]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = (file) => {
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setError(null);
        } else {
            setError('Please select a valid PDF file');
            setSelectedFile(null);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const analyzePDF = async () => {
        if (!selectedFile) {
            setError('Please select a PDF file first');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('http://localhost:5000/api/analyze_pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setAnalysis(data);
                // Add to history
                setUploadHistory(prev => [{
                    filename: data.filename,
                    timestamp: new Date().toLocaleString(),
                    pages: data.num_pages,
                    words: data.word_count
                }, ...prev.slice(0, 4)]); // Keep last 5
            } else {
                setError(data.error || 'Failed to analyze PDF');
            }
        } catch (err) {
            setError('Failed to connect to the server. Make sure the backend is running.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setAnalysis(null);
        setError(null);
    };

    const exportToPDF = () => {
        if (!analysis) return;

        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.setTextColor(41, 98, 255); // Blue color
        doc.text("Document Analysis Summary", 20, 20);

        // Metadata
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`File: ${analysis.filename}`, 20, 30);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 35);
        doc.text(`Pages: ${analysis.num_pages} | Words: ${analysis.word_count}`, 20, 40);

        // Line separator
        doc.setDrawColor(200);
        doc.line(20, 45, 190, 45);

        // Content
        doc.setFontSize(12);
        doc.setTextColor(0);

        // Split text to fit page width
        const splitText = doc.splitTextToSize(analysis.summary, 170);
        doc.text(splitText, 20, 55);

        // Save
        doc.save(`Summary-${analysis.filename}.pdf`);
    };

    return (
        <div className="p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📚 Assignments</h1>
                    <p className="text-gray-600 mt-1">Upload and analyze your PDF documents with AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card hover>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload PDF Document</h2>

                        {/* Drag and Drop Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragging
                                    ? 'border-blue-500 bg-blue-50 scale-105'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                }`}
                        >
                            <div className="space-y-4">
                                <div className="text-6xl">📄</div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">
                                        {selectedFile ? selectedFile.name : 'Drag & drop your PDF here'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileInput}
                                    className="hidden"
                                    id="pdf-upload"
                                />
                                <label
                                    htmlFor="pdf-upload"
                                    className="inline-block gradient-primary text-white px-6 py-3 rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all"
                                >
                                    Browse Files
                                </label>
                            </div>
                        </div>

                        {/* Selected File Info */}
                        {selectedFile && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center justify-between animate-fade-in">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">📎</span>
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {(selectedFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="text-red-500 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fade-in">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Analyze Button */}
                        <button
                            onClick={analyzePDF}
                            disabled={!selectedFile || isAnalyzing}
                            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${selectedFile && !isAnalyzing
                                    ? 'gradient-primary text-white hover:shadow-xl hover:scale-105'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <span className="animate-spin">⚙️</span>
                                    <span>Analyzing PDF...</span>
                                </span>
                            ) : (
                                '🤖 Analyze with AI'
                            )}
                        </button>
                    </Card>

                    {/* Analysis Results */}
                    {analysis && (
                        <Card hover className="animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">📊 Analysis Results</h2>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>📄 {analysis.num_pages} pages</span>
                                    <span>📝 {analysis.word_count} words</span>
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                        {analysis.summary}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={exportToPDF}
                                    className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <span>📄</span>
                                    <span>Export to PDF</span>
                                </button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card variant="gradient">
                        <div className="text-center text-white">
                            <div className="text-5xl mb-3">🎯</div>
                            <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
                            <p className="text-white/90 text-sm">
                                Get instant summaries and insights from your PDF documents
                            </p>
                        </div>
                    </Card>

                    {/* Upload History */}
                    {uploadHistory.length > 0 && (
                        <Card hover>
                            <h3 className="font-bold text-gray-900 mb-4">📜 Recent Uploads</h3>
                            <div className="space-y-3">
                                {uploadHistory.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                            {item.filename}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-600">{item.timestamp}</p>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{item.pages}p</span>
                                                <span>•</span>
                                                <span>{item.words}w</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Features */}
                    <Card hover>
                        <h3 className="font-bold text-gray-900 mb-4">✨ Features</h3>
                        <div className="space-y-3">
                            {[
                                { icon: '🔍', text: 'Deep content analysis' },
                                { icon: '📝', text: 'Key points extraction' },
                                { icon: '🎯', text: 'Smart summarization' },
                                { icon: '⚡', text: 'Instant results' }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-3">
                                    <span className="text-2xl">{feature.icon}</span>
                                    <span className="text-sm text-gray-700">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Tips */}
                    <Card hover>
                        <h3 className="font-bold text-gray-900 mb-4">💡 Tips</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Upload clear, text-based PDFs for best results</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Scanned documents may have lower accuracy</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Analysis works best with documents under 50 pages</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Assignments;
