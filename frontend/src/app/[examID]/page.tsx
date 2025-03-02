'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { examService } from '@/app/api/examService';
import { useParams } from 'next/navigation';
import { Editor } from '@monaco-editor/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';
import ReactMarkdown from 'react-markdown';
const ExamSession = () => {
    const params = useParams();
    const [questions, setQuestions] = useState<{ id: number; text: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
    const [session, setSession] = useState<{ id: number; time: number } | null>(null);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [password, setPassword] = useState('');
    // State for the width of the left and right sections
    const [leftWidth, setLeftWidth] = useState(50); // Initial left width 50%
    const [isResizing, setIsResizing] = useState(false);
    const [isExamStarted, setIsExamStarted] = useState(false); // To track if the exam has started
    const [hasSolvedExam, setHasSolvedExam] = useState(false); // To track if the user has already solved the exam
    const [examResults, setExamResults] = useState<{
        student: { user_id: number; name: string; email: string; total_points: number };
        answers: { question_id: number; question: string; points_possible: number; answer: string; points_awarded: number }[];
    } | null>(null); // To store exam results
    const [showAnswers, setShowAnswers] = useState(false); // To toggle the display of answers
    const [editingPoints, setEditingPoints] = useState<number | null>(null); // Track the question_id being edited
    const [updatedPoints, setUpdatedPoints] = useState<{ [key: number]: number }>({}); // To store updated points
    const router = useRouter();


    const exam_id = Array.isArray(params.examID) ? parseInt(params.examID[0], 10) : parseInt(params.examID, 10);
    const user = localStorage.getItem('user');
    const userRole = user ? JSON.parse(user).role : null;
    const CheckIfUserSolvedExam = async (exam_id: number, user_id: number) => {
        const data = await examService.useCheckIfUserSolvedExam(exam_id, user_id);
        return data;
    }

    useEffect(() => {
        // Check if the user has already solved the exam
        const user = localStorage.getItem('user');
        const user_id = user ? JSON.parse(user).id : null;
        const checkExamStatus = async () => {
            if (user_id && exam_id) {
                const hasSolved = await CheckIfUserSolvedExam(exam_id, user_id);

                if (hasSolved === true) {
                    console.log('User has already solved the exam');
                    setHasSolvedExam(hasSolved);
                    const results = await examService.useFetchUsersAnwsersAndPoints(exam_id, user_id);
                    setExamResults(results);
                }
            }
        };

        checkExamStatus();
    }, [exam_id, router]);
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            alert('Time is up! Submitting the exam.');
            endExam();
        }

    }, [timeLeft]);

    const validatePassword = async (exam_id: number, password: string) => {
        // Call your backend to validate the password
        const response = await examService.useValidatePassword(exam_id, password);

        return response.isValid;
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const startExam = async () => {
        const user = localStorage.getItem('user');

        let user_id;
        if (user) {
            user_id = JSON.parse(user).id;
        }

        const exam_id = Array.isArray(params.examID) ? parseInt(params.examID[0], 10) : parseInt(params.examID, 10);

        // Send password to the backend for validation
        const isPasswordValid = await validatePassword(exam_id, password);
        if (isPasswordValid) {
            const data = await examService.useStartExam(exam_id, user_id);
            if (data) {
                setSession(data.session);
                setQuestions(data.questions);
                setTimeLeft(data.session.time * 60);
                setIsExamStarted(true); // Set exam started flag to true
                setIsDialogOpen(false); // Close the dialog
            }
        } else {
            alert('Invalid password');
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            endExam();
        }
    };

    const lastQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleAnswerChange = (value: string | undefined, questionID: number) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionID]: value || ""
        }));
    };

    const submitAnswer = async (sessionID: number, questionID: number) => {
        if (session?.id && questionID) {
            const answerToSubmit = answers[questionID] || "";
            const data = await examService.useSubmitAnswer(session.id, questionID, answerToSubmit);
            if (data) {
                console.log('Answer submitted successfully');
            }
        }
    };

    const endExam = async () => {
        if (session?.id) {
            const user = localStorage.getItem('user');
            const exam_id = Array.isArray(params.examID) ? parseInt(params.examID[0], 10) : parseInt(params.examID, 10);
            let user_id;

            if (user) {
                user_id = JSON.parse(user).id;
            }
            const data = await examService.useEndExam(exam_id, user_id);
            if (data) {
                console.log('Exam ended successfully');
                router.push('/dashboard');
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isResizing) {
            const newLeftWidth = Math.min(100, Math.max(10, (e.clientX / window.innerWidth) * 100));
            setLeftWidth(newLeftWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };
    const updatePoints = async (question_id: number, points_awarded: number) => {
        if (examResults) {
            const updatedResults = { ...examResults };
            const answerIndex = updatedResults.answers.findIndex((answer) => answer.question_id === question_id);
            if (answerIndex !== -1) {
                updatedResults.answers[answerIndex].points_awarded = points_awarded;
                updatedResults.student.total_points = updatedResults.answers.reduce(
                    (total, answer) => total + answer.points_awarded,
                    0
                );
                setExamResults(updatedResults);

                // Send the updated points to the backend
                const response = await examService.useUpdatePoints(exam_id, question_id, points_awarded);
                if (response) {
                    console.log('Points updated successfully');
                }
            }
        }
    };
    const handleEditPoints = (question_id: number) => {
        setEditingPoints(question_id); // Set the question_id being edited
        setUpdatedPoints((prev) => ({
            ...prev,
            [question_id]: examResults?.answers.find((answer) => answer.question_id === question_id)?.points_awarded || 0,
        }));
    };

    const handleSavePoints = (question_id: number) => {
        if (updatedPoints[question_id] !== undefined) {
            updatePoints(question_id, updatedPoints[question_id]);
            setEditingPoints(null); // Reset editing state after saving
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div className="flex h-screen bg-zinc-800 text-white min-h-screen">
            {/* Display exam results if the user has already solved the exam */}
            {hasSolvedExam && examResults ? (
                <div className="flex flex-col p-4 w-full justify-center items-center overflow-auto min-h-screen">
                    <h2 className="text-3xl font-bold mb-4 ">
                        Your Total Points: {examResults.student.total_points}
                    </h2>
                    <Button onClick={() => setShowAnswers(!showAnswers)} className="mb-4">
                        {showAnswers ? 'Hide Answers' : 'View Answers'}
                    </Button>
                    {showAnswers && (
                        <div className="space-y-4 w-full max-w-4xl overflow-y-auto max-h-[70vh]">
                            {examResults?.answers.map((answer, index) => (
                                <div key={index} className="p-4 bg-zinc-700 rounded-lg">
                                    <h3 className="text-xl font-semibold">Question: {answer.question}</h3>
                                    <p className="text-lg">Your Answer: {answer.answer}</p>
                                    <p className="text-lg">
                                        Points Awarded: {answer.points_awarded} / {answer.points_possible}
                                    </p>
                                    {/* Add edit functionality for non-student roles */}
                                    {userRole !== 'student' && (
                                        <div className="mt-2">
                                            {editingPoints === answer.question_id ? ( // Only show input for the question being edited
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={updatedPoints[answer.question_id] || 0}
                                                        onChange={(e) =>
                                                            setUpdatedPoints((prev) => ({
                                                                ...prev,
                                                                [answer.question_id]: parseInt(e.target.value, 10),
                                                            }))
                                                        }
                                                        className="w-20"
                                                        min={0}
                                                        max={answer.points_possible}
                                                    />
                                                    <Button onClick={() => handleSavePoints(answer.question_id)}>
                                                        Save
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button onClick={() => handleEditPoints(answer.question_id)}>
                                                    Edit Points
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Show Start Exam Button if exam has not started */}
                    {!isExamStarted ? (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="default" onClick={() => setIsDialogOpen(true)} className="m-auto">
                                    Start Exam
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Enter Exam Password</DialogTitle>
                                    <DialogDescription>
                                        Please enter the password to start the exam.
                                    </DialogDescription>
                                </DialogHeader>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border p-2 w-full mb-4"
                                    placeholder="Password"
                                />
                                <DialogFooter>
                                    <Button onClick={startExam} className="w-full">Submit</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div style={{ width: `${leftWidth}%` }} className="flex flex-col p-4 justify-between">
                            <div>
                                {/* Timer */}
                                <h2 className="text-5xl font-bold mb-4 text-center">
                                    Time Left: {formatTime(timeLeft)}
                                </h2>

                                {/* Question */}
                                <h3 className="text-xl font-semibold mb-4">Question {currentIndex + 1} / {questions.length}</h3>
                                <div className="markdown-body mb-4">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{questions[currentIndex]?.text}</ReactMarkdown>
                                </div>

                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between w-full mt-auto">
                                <Button onClick={lastQuestion}>Last Question</Button>
                                <Button onClick={() => {
                                    if (currentIndex < questions.length - 1) {
                                        nextQuestion();
                                        submitAnswer(session.id, questions[currentIndex]?.id);
                                    } else {
                                        endExam();  // If it's the last question, finish the exam
                                    }
                                }}>
                                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="bg-gray-600 cursor-ew-resize"
                        style={{ width: '5px', height: '100%' }}
                    ></div>

                    {/* Right Section for Editor */}
                    {isExamStarted && (
                        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col">
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                defaultLanguage="javascript"
                                value={answers[questions[currentIndex]?.id] || ""}
                                onChange={(value) => handleAnswerChange(value, questions[currentIndex]?.id)}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ExamSession;
