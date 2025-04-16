import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Analysis } from '../types';

interface AnalysisFormProps {
  argument: string;
  analysis: Analysis | null;
  setAnalysis: (analysis: Analysis) => void;
  loading: boolean;
  onSubmit: () => void;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({
  argument,
  analysis,
  setAnalysis,
  loading,
  onSubmit,
}) => {
  const [claims, setClaims] = useState<string[]>(analysis?.claims || ['']);
  const [evidence, setEvidence] = useState<string[]>(analysis?.evidence || ['']);
  const [structure, setStructure] = useState<string>(analysis?.structure || '');
  const [suggestions, setSuggestions] = useState<string[]>(analysis?.suggestions || ['']);

  const handleClaimChange = (index: number, value: string) => {
    const newClaims = [...claims];
    newClaims[index] = value;
    setClaims(newClaims);
  };

  const handleEvidenceChange = (index: number, value: string) => {
    const newEvidence = [...evidence];
    newEvidence[index] = value;
    setEvidence(newEvidence);
  };

  const handleSuggestionChange = (index: number, value: string) => {
    const newSuggestions = [...suggestions];
    newSuggestions[index] = value;
    setSuggestions(newSuggestions);
  };

  const addClaim = () => {
    setClaims([...claims, '']);
  };

  const addEvidence = () => {
    setEvidence([...evidence, '']);
  };

  const addSuggestion = () => {
    setSuggestions([...suggestions, '']);
  };

  const handleSubmit = () => {
    setAnalysis({
      claims: claims.filter(claim => claim.trim() !== ''),
      evidence: evidence.filter(ev => ev.trim() !== ''),
      structure,
      suggestions: suggestions.filter(suggestion => suggestion.trim() !== ''),
    });
    onSubmit();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        논증문 분석
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {argument}
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        주장
      </Typography>
      {claims.map((claim, index) => (
        <TextField
          key={index}
          fullWidth
          multiline
          rows={2}
          value={claim}
          onChange={(e) => handleClaimChange(index, e.target.value)}
          sx={{ mb: 2 }}
        />
      ))}
      <Button variant="outlined" onClick={addClaim} sx={{ mb: 3 }}>
        주장 추가
      </Button>

      <Typography variant="subtitle1" gutterBottom>
        근거
      </Typography>
      {evidence.map((ev, index) => (
        <TextField
          key={index}
          fullWidth
          multiline
          rows={2}
          value={ev}
          onChange={(e) => handleEvidenceChange(index, e.target.value)}
          sx={{ mb: 2 }}
        />
      ))}
      <Button variant="outlined" onClick={addEvidence} sx={{ mb: 3 }}>
        근거 추가
      </Button>

      <Typography variant="subtitle1" gutterBottom>
        근거를 뒷받침하는 내용
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={4}
        value={structure}
        onChange={(e) => setStructure(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle1" gutterBottom>
        제안사항
      </Typography>
      {suggestions.map((suggestion, index) => (
        <TextField
          key={index}
          fullWidth
          multiline
          rows={2}
          value={suggestion}
          onChange={(e) => handleSuggestionChange(index, e.target.value)}
          sx={{ mb: 2 }}
        />
      ))}
      <Button variant="outlined" onClick={addSuggestion} sx={{ mb: 3 }}>
        제안사항 추가
      </Button>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : '분석 제출'}
      </Button>
    </Box>
  );
};

export default AnalysisForm; 