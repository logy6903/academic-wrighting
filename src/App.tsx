import React, { useState, ChangeEvent, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Paper
} from '@mui/material';
import { OpenAI } from 'openai';
import AnalysisForm from './components/AnalysisForm';
import { Analysis, Evaluation } from './types';

declare global {
  interface Window {
    process: {
      env: {
        REACT_APP_OPENAI_API_KEY: string;
      };
    };
  }
}

type Difficulty = 'easy' | 'medium' | 'hard';
type ContentType = 'text' | 'image' | 'graph';
type VisualType = 'illustration' | 'infographic' | 'statistics';

interface AppState {
  input: string;
  difficulty: Difficulty;
  contentType: ContentType;
  visualType: VisualType;
  generatedContent: string;
  generatedImage: string | null;
  loading: boolean;
  analysis: Analysis | null;
  evaluation: Evaluation | null;
}

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [contentType, setContentType] = useState<ContentType>('text');
  const [visualType, setVisualType] = useState<VisualType>('illustration');
  const [argument, setArgument] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string>('');

  const handleDifficultyChange = (event: SelectChangeEvent<Difficulty>) => {
    setDifficulty(event.target.value as Difficulty);
  };

  const handleContentTypeChange = (event: SelectChangeEvent<ContentType>) => {
    setContentType(event.target.value as ContentType);
  };

  const handleVisualTypeChange = (event: SelectChangeEvent<VisualType>) => {
    setVisualType(event.target.value as VisualType);
  };

  const generateContent = async () => {
    setLoading(true);
    setError('');
    try {
      if (contentType === 'text') {
        await generateArgument();
      } else {
        await generateVisualContent();
      }
      setStep(1);
    } catch (err) {
      console.error('Content generation error:', err);
      setError('콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const generateArgument = async () => {
    const difficultyPrompt = {
      easy: '한 단락으로 구성된 간단한 주장을 작성해주세요.',
      medium: '2-3개의 단락으로 구성된 논리적인 주장을 작성해주세요.',
      hard: '3-5개의 단락으로 구성된 복잡하고 심도 있는 주장을 작성해주세요.',
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `당신은 주어진 주제에 대해 다양한 논리 구조를 사용하여 주장을 작성하는 전문가입니다.
          주어진 난이도에 따라 적절한 문장 구조와 논리적 복잡성을 사용해야 합니다.
          각 단락은 명확하게 구분되어야 하며, 단락 간의 논리적 연결이 자연스러워야 합니다.
          주장은 반드시 한국어로 작성되어야 합니다.`
        },
        {
          role: 'user',
          content: `주제: ${topic}\n난이도: ${difficulty}\n${difficultyPrompt[difficulty]}\n\n주장을 작성해주세요.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    setArgument(completion.choices[0].message.content || '');
  };

  const generateVisualContent = async () => {
    try {
      let prompt = '';
      if (contentType === 'image') {
        if (visualType === 'statistics') {
          prompt = `다음 주제에 대한 통계 그래프를 생성해주세요: ${topic}. 
          그래프는 다음 요구사항을 충족해야 합니다:
          1. 데이터를 명확하게 표현하는 적절한 그래프 유형 선택
          2. 한글로 된 제목, 축 레이블, 범례 포함
          3. 데이터 포인트에 대한 명확한 레이블링
          4. 시각적으로 구분이 쉬운 색상 사용
          5. 필요한 경우 추세선이나 주석 포함`;
        } else {
          prompt = `다음 주제에 대한 시각적 이미지를 생성해주세요: ${topic}. 이미지에는 한글 텍스트가 포함되어야 하며, 텍스트는 명확하고 읽기 쉬워야 합니다.`;
        }

        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural',
        });

        const imageUrl = image.data[0]?.url;
        if (!imageUrl) {
          throw new Error('이미지 URL을 받지 못했습니다.');
        }

        setGeneratedImage(imageUrl);
        setArgument(imageUrl);
      }
    } catch (err) {
      console.error('Visual content generation error:', err);
      throw new Error('시각적 콘텐츠 생성 중 오류가 발생했습니다.');
    }
  };

  const evaluateAnalysis = async (currentAnalysis: Analysis) => {
    setLoading(true);
    setError(null);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `당신은 논증문 분석 전문가입니다. 다음 기준에 따라 사용자의 분석을 엄격하게 평가해주세요:

1. 주장 평가:
   - 핵심 주장의 정확성 (틀린 부분은 반드시 지적)
   - 주요 키워드의 식별 (누락된 키워드는 반드시 지적)
   - 주장의 논리적 오류나 모순점 지적

2. 근거 평가:
   - 각 근거의 정확성 (틀린 근거는 반드시 지적)
   - 키워드 식별의 적절성 (누락된 키워드는 반드시 지적)
   - 근거의 계층 구조 평가
   - 전체 근거 중 몇 개가 누락되었는지 정확히 계산
   - 부적절한 근거나 논리적 오류 지적

3. 전체 구조 평가:
   - 근거 간 계층적 관계의 적절성
   - 전체 논증 구조의 완성도
   - 논리적 오류나 모순점 지적

다음 형식으로 응답해주세요:
{
  "claimEvaluation": {
    "feedback": "주장에 대한 엄격한 피드백을 작성해주세요. 틀린 부분은 반드시 지적해주세요.",
    "missedKeywords": ["누락된 키워드가 있다면 작성해주세요"],
    "logicalErrors": ["논리적 오류나 모순점이 있다면 작성해주세요"]
  },
  "evidenceEvaluation": {
    "feedback": "근거에 대한 엄격한 피드백을 작성해주세요. 틀린 근거는 반드시 지적해주세요.",
    "missedKeywords": ["누락된 키워드가 있다면 작성해주세요"],
    "missedEvidence": ["누락된 근거가 있다면 작성해주세요"],
    "totalEvidenceCount": "원문에 있는 전체 근거의 수",
    "submittedEvidenceCount": "사용자가 제출한 근거의 수",
    "logicalErrors": ["논리적 오류나 모순점이 있다면 작성해주세요"]
  },
  "overallStructure": {
    "feedback": "전체 구조에 대한 엄격한 피드백을 작성해주세요. 논리적 오류나 모순점은 반드시 지적해주세요.",
    "logicalErrors": ["논리적 오류나 모순점이 있다면 작성해주세요"]
  }
}`
          },
          {
            role: 'user',
            content: `논증문:\n${argument}\n\n사용자의 분석:\n주장:\n${currentAnalysis.claims.join('\n')}\n\n근거:\n${currentAnalysis.evidence.join('\n')}\n\n근거를 뒷받침하는 내용:\n${currentAnalysis.structure}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('평가 결과를 받지 못했습니다.');
      }

      try {
        const evaluationResult = JSON.parse(completion.choices[0].message.content);
        console.log('평가 결과:', evaluationResult);
        setEvaluation(evaluationResult);
        setStep(1.5);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('평가 결과 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('분석 평가 오류:', error);
      setError('평가 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnalysis = async () => {
    if (!analysis) {
      setError('분석 내용을 입력해주세요.');
      return;
    }
    await evaluateAnalysis(analysis);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        논증문 분석 연습
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {step === 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              분석할 화제를 입력하세요
            </Typography>
            <TextField
              fullWidth
              label="화제"
              value={topic}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>난이도</InputLabel>
                  <Select
                    value={difficulty}
                    label="난이도"
                    onChange={handleDifficultyChange}
                  >
                    <MenuItem value="easy">쉬움</MenuItem>
                    <MenuItem value="medium">보통</MenuItem>
                    <MenuItem value="hard">어려움</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>콘텐츠 유형</InputLabel>
                  <Select
                    value={contentType}
                    label="콘텐츠 유형"
                    onChange={handleContentTypeChange}
                  >
                    <MenuItem value="text">텍스트</MenuItem>
                    <MenuItem value="image">이미지</MenuItem>
                    <MenuItem value="graph">그래프</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {contentType === 'image' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>이미지 유형</InputLabel>
                <Select
                  value={visualType}
                  label="이미지 유형"
                  onChange={handleVisualTypeChange}
                >
                  <MenuItem value="illustration">일러스트레이션</MenuItem>
                  <MenuItem value="infographic">인포그래픽</MenuItem>
                  <MenuItem value="statistics">통계 그래프</MenuItem>
                </Select>
              </FormControl>
            )}

            <Button
              variant="contained"
              onClick={generateContent}
              disabled={!topic || loading}
            >
              {loading ? <CircularProgress size={24} /> : '생성하기'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step >= 1 && contentType === 'text' && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <AnalysisForm
              argument={argument}
              analysis={analysis}
              setAnalysis={setAnalysis}
              loading={loading}
              onSubmit={submitAnalysis}
            />
          </CardContent>
        </Card>
      )}

      {evaluation && step >= 1.5 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              평가 결과
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                주장 평가
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {evaluation.claimEvaluation.feedback}
              </Typography>
              {evaluation.claimEvaluation.missedKeywords?.length > 0 && (
                <Typography color="error.main" sx={{ mb: 1 }}>
                  누락된 키워드: {evaluation.claimEvaluation.missedKeywords.join(', ')}
                </Typography>
              )}
              {evaluation.claimEvaluation.logicalErrors?.length > 0 && (
                <Typography color="error.main">
                  논리적 오류: {evaluation.claimEvaluation.logicalErrors.join(', ')}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                근거 평가
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {evaluation.evidenceEvaluation.feedback}
              </Typography>
              {evaluation.evidenceEvaluation.missedKeywords?.length > 0 && (
                <Typography color="error.main" sx={{ mb: 1 }}>
                  누락된 키워드: {evaluation.evidenceEvaluation.missedKeywords.join(', ')}
                </Typography>
              )}
              {evaluation.evidenceEvaluation.missedEvidence?.length > 0 && (
                <Typography color="error.main" sx={{ mb: 1 }}>
                  누락된 근거: {evaluation.evidenceEvaluation.missedEvidence.join(', ')}
                </Typography>
              )}
              <Typography color="error.main" sx={{ mb: 1 }}>
                근거 완성도: {evaluation.evidenceEvaluation.submittedEvidenceCount} / {evaluation.evidenceEvaluation.totalEvidenceCount}
              </Typography>
              {evaluation.evidenceEvaluation.logicalErrors?.length > 0 && (
                <Typography color="error.main">
                  논리적 오류: {evaluation.evidenceEvaluation.logicalErrors.join(', ')}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                전체 구조 평가
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {evaluation.overallStructure.feedback}
              </Typography>
              {evaluation.overallStructure.logicalErrors?.length > 0 && (
                <Typography color="error.main">
                  논리적 오류: {evaluation.overallStructure.logicalErrors.join(', ')}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => setStep(1)}
                sx={{ mr: 2 }}
              >
                수정하기
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setStep(0);
                  setAnalysis(null);
                  setEvaluation(null);
                }}
              >
                새로운 분석 시작
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default App; 