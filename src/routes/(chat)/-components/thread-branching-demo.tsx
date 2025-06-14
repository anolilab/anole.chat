"use client";

import React, { useState } from "react";
import { useThreadContext } from "./thread-context";
import { BranchTreeView, BranchNavigation, BranchStats, MessageWithBranching } from "./thread-branching-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GitBranch, MessageSquare, TreePine, BarChart3, Navigation, Lightbulb, Code, Users } from "lucide-react";
import type { ThreadMessageLike } from "@assistant-ui/react";

// Sample messages for demonstration
const createSampleMessage = (id: string, role: "user" | "assistant", content: string): ThreadMessageLike => ({
    id,
    role,
    content: [{ type: "text", text: content }],
    createdAt: new Date(),
});

const sampleMessages: ThreadMessageLike[] = [
    createSampleMessage("1", "user", "Hello! I need help with a React project."),
    createSampleMessage("2", "assistant", "I'd be happy to help with your React project! What specific aspect are you working on?"),
    createSampleMessage("3", "user", "I'm trying to implement state management. Should I use Redux or Context API?"),
    createSampleMessage(
        "4",
        "assistant",
        "Great question! The choice between Redux and Context API depends on your project's complexity and requirements. Let me break down the considerations...",
    ),
    createSampleMessage("5", "user", "That's helpful! Can you show me a simple example of Context API?"),
];

interface DemoSectionProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const DemoSection: React.FC<DemoSectionProps> = ({ title, description, icon, children }) => (
    <Card className="h-full">
        <CardHeader>
            <CardTitle className="flex items-center space-x-2">
                {icon}
                <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

interface BranchingExampleProps {
    className?: string;
}

const BranchingExample: React.FC<BranchingExampleProps> = ({ className }) => {
    const { currentThreadId, threads, threadMetadata, createBranch, switchToBranch, setThreads, setThreadMetadata } = useThreadContext();

    const [demoStep, setDemoStep] = useState(0);

    // Initialize demo data
    const initializeDemoData = () => {
        // Set up sample messages in current thread
        setThreads((prev) => new Map(prev).set(currentThreadId, sampleMessages));
        setThreadMetadata((prev) =>
            new Map(prev).set(currentThreadId, {
                title: "React State Management Discussion",
                status: "active",
                createdAt: new Date(),
                lastActivity: new Date(),
            }),
        );
        setDemoStep(1);
    };

    // Create a branch from message 3 (Redux vs Context question)
    const createReduxBranch = async () => {
        try {
            const branchId = await createBranch(currentThreadId, 2, "Redux Deep Dive");

            // Add some Redux-specific messages to the branch
            const reduxMessages = [
                ...sampleMessages.slice(0, 3),
                createSampleMessage(
                    "4-redux",
                    "assistant",
                    "Let's dive deep into Redux! Redux is excellent for complex applications with intricate state management needs. Here's why you might choose Redux...",
                ),
                createSampleMessage("5-redux", "user", "Can you show me how to set up a Redux store?"),
                createSampleMessage(
                    "6-redux",
                    "assistant",
                    "Absolutely! Here's a step-by-step guide to setting up Redux with Redux Toolkit (the modern way)...",
                ),
            ];

            setThreads((prev) => new Map(prev).set(branchId, reduxMessages));
            setDemoStep(2);
        } catch (error) {
            console.error("Failed to create Redux branch:", error);
        }
    };

    // Create a branch from message 3 (Context API path)
    const createContextBranch = async () => {
        try {
            const branchId = await createBranch(currentThreadId, 2, "Context API Tutorial");

            // Add some Context API-specific messages to the branch
            const contextMessages = [
                ...sampleMessages.slice(0, 3),
                createSampleMessage(
                    "4-context",
                    "assistant",
                    "Context API is perfect for simpler state management needs! It's built into React and great for avoiding prop drilling. Let me show you how to use it effectively...",
                ),
                createSampleMessage("5-context", "user", "This looks much simpler! Can you show me a practical example?"),
                createSampleMessage(
                    "6-context",
                    "assistant",
                    "Certainly! Here's a practical example of using Context API for theme management in a React app...",
                ),
            ];

            setThreads((prev) => new Map(prev).set(branchId, contextMessages));
            setDemoStep(3);
        } catch (error) {
            console.error("Failed to create Context branch:", error);
        }
    };

    const resetDemo = () => {
        setDemoStep(0);
        // Clear demo data
        setThreads((prev) => new Map(prev).set(currentThreadId, []));
        setThreadMetadata((prev) =>
            new Map(prev).set(currentThreadId, {
                title: "New Chat",
                status: "active",
                createdAt: new Date(),
                lastActivity: new Date(),
            }),
        );
    };

    const currentMessages = threads.get(currentThreadId) || [];

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="space-y-4 text-center">
                <h3 className="text-lg font-semibold">Interactive Branching Demo</h3>
                <p className="text-sm text-gray-600">Follow the steps below to see how conversation branching works in practice.</p>

                <div className="flex justify-center space-x-2">
                    <Badge variant={demoStep >= 1 ? "default" : "outline"}>1. Setup</Badge>
                    <Badge variant={demoStep >= 2 ? "default" : "outline"}>2. Redux Branch</Badge>
                    <Badge variant={demoStep >= 3 ? "default" : "outline"}>3. Context Branch</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Demo Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Code className="h-5 w-5" />
                            <span>Demo Controls</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {demoStep === 0 && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">Start by setting up a sample conversation about React state management.</p>
                                <Button onClick={initializeDemoData} className="w-full">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Initialize Demo Conversation
                                </Button>
                            </div>
                        )}

                        {demoStep === 1 && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">Now create branches to explore different state management approaches.</p>
                                <Button onClick={createReduxBranch} className="w-full">
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Create Redux Branch
                                </Button>
                                <Button onClick={createContextBranch} variant="outline" className="w-full">
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Create Context API Branch
                                </Button>
                            </div>
                        )}

                        {demoStep >= 2 && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">Great! You've created branches. Use the tree view to navigate between them.</p>
                                <Button onClick={resetDemo} variant="outline" className="w-full">
                                    Reset Demo
                                </Button>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Current Thread Info</h4>
                            <div className="space-y-1 text-xs">
                                <div>
                                    ID: <code className="rounded bg-gray-100 px-1">{currentThreadId}</code>
                                </div>
                                <div>Messages: {currentMessages.length}</div>
                                <div>Title: {threadMetadata.get(currentThreadId)?.title || "Untitled"}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Messages Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <MessageSquare className="h-5 w-5" />
                            <span>Messages Preview</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 space-y-3 overflow-y-auto">
                            {currentMessages.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">
                                    <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                    <p>No messages yet. Start the demo to see sample conversation.</p>
                                </div>
                            ) : (
                                currentMessages.map((message, index) => (
                                    <MessageWithBranching key={message.id} message={message} messageIndex={index} threadId={currentThreadId}>
                                        <div
                                            className={`rounded-lg p-3 ${
                                                message.role === "user" ? "border-l-2 border-blue-500 bg-blue-50" : "border-l-2 border-gray-300 bg-gray-50"
                                            }`}
                                        >
                                            <div className="mb-1 flex items-center space-x-2">
                                                <Badge variant={message.role === "user" ? "default" : "secondary"}>{message.role}</Badge>
                                                <span className="text-xs text-gray-500">#{index + 1}</span>
                                            </div>
                                            <p className="text-sm">{message.content[0]?.type === "text" ? message.content[0].text : ""}</p>
                                        </div>
                                    </MessageWithBranching>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export const ThreadBranchingDemo: React.FC = () => {
    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6">
            {/* Header */}
            <div className="space-y-4 text-center">
                <h1 className="flex items-center justify-center space-x-3 text-3xl font-bold">
                    <GitBranch className="h-8 w-8" />
                    <span>Thread Branching System</span>
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-gray-600">
                    Explore multiple conversation paths without losing context. Create branches from any message to investigate different topics, compare
                    approaches, or maintain parallel discussions.
                </p>
            </div>

            {/* Feature Overview */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <GitBranch className="mx-auto mb-4 h-12 w-12 text-blue-500" />
                        <h3 className="mb-2 font-semibold">Smart Branching</h3>
                        <p className="text-sm text-gray-600">Create branches from any message to explore different conversation paths</p>
                    </CardContent>
                </Card>

                <Card className="text-center">
                    <CardContent className="pt-6">
                        <TreePine className="mx-auto mb-4 h-12 w-12 text-green-500" />
                        <h3 className="mb-2 font-semibold">Visual Tree</h3>
                        <p className="text-sm text-gray-600">Navigate your conversation hierarchy with an intuitive tree interface</p>
                    </CardContent>
                </Card>

                <Card className="text-center">
                    <CardContent className="pt-6">
                        <Users className="mx-auto mb-4 h-12 w-12 text-purple-500" />
                        <h3 className="mb-2 font-semibold">Context Preservation</h3>
                        <p className="text-sm text-gray-600">Each branch maintains its own context while preserving the original conversation</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Demo Tabs */}
            <Tabs defaultValue="demo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="demo" className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>Interactive Demo</span>
                    </TabsTrigger>
                    <TabsTrigger value="tree" className="flex items-center space-x-2">
                        <TreePine className="h-4 w-4" />
                        <span>Tree View</span>
                    </TabsTrigger>
                    <TabsTrigger value="navigation" className="flex items-center space-x-2">
                        <Navigation className="h-4 w-4" />
                        <span>Navigation</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Statistics</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="demo" className="mt-6">
                    <BranchingExample />
                </TabsContent>

                <TabsContent value="tree" className="mt-6">
                    <DemoSection
                        title="Branch Tree Visualization"
                        description="See all your conversation branches in a hierarchical tree structure"
                        icon={<TreePine className="h-5 w-5" />}
                    >
                        <BranchTreeView className="min-h-96" />
                    </DemoSection>
                </TabsContent>

                <TabsContent value="navigation" className="mt-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <DemoSection
                            title="Branch Navigation"
                            description="Breadcrumb navigation showing your current position in the conversation tree"
                            icon={<Navigation className="h-5 w-5" />}
                        >
                            <div className="space-y-4">
                                <BranchNavigation />
                                <div className="text-sm text-gray-600">
                                    <p>The navigation breadcrumb shows:</p>
                                    <ul className="mt-2 list-inside list-disc space-y-1">
                                        <li>Your current path from root to current thread</li>
                                        <li>Clickable thread names for quick navigation</li>
                                        <li>Visual hierarchy with separators</li>
                                    </ul>
                                </div>
                            </div>
                        </DemoSection>

                        <DemoSection title="Quick Actions" description="Common branching operations and shortcuts" icon={<GitBranch className="h-5 w-5" />}>
                            <div className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <h4 className="font-medium">Available Actions:</h4>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>
                                            • <strong>Branch from message:</strong> Hover over any message to see the branch button
                                        </li>
                                        <li>
                                            • <strong>Rename branches:</strong> Right-click on any branch in the tree
                                        </li>
                                        <li>
                                            • <strong>Merge branches:</strong> Combine branch content back to parent
                                        </li>
                                        <li>
                                            • <strong>Delete branches:</strong> Remove unwanted conversation paths
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </DemoSection>
                    </div>
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                    <DemoSection
                        title="Branching Statistics"
                        description="Overview of your conversation structure and metrics"
                        icon={<BarChart3 className="h-5 w-5" />}
                    >
                        <BranchStats />
                    </DemoSection>
                </TabsContent>
            </Tabs>

            {/* Use Cases */}
            <Card>
                <CardHeader>
                    <CardTitle>Use Cases for Thread Branching</CardTitle>
                    <CardDescription>Here are some practical scenarios where conversation branching shines</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-600">Technical Discussions</h4>
                            <p className="text-sm text-gray-600">
                                Explore different implementation approaches for the same problem without losing the original context.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-green-600">Creative Writing</h4>
                            <p className="text-sm text-gray-600">Develop multiple storylines or character arcs from the same starting point.</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-purple-600">Decision Making</h4>
                            <p className="text-sm text-gray-600">Analyze different options and their consequences in parallel conversations.</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-orange-600">Learning & Research</h4>
                            <p className="text-sm text-gray-600">Deep dive into specific topics while maintaining the broader discussion context.</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-red-600">Debugging & Troubleshooting</h4>
                            <p className="text-sm text-gray-600">Test different solutions and compare their effectiveness side by side.</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-indigo-600">Collaborative Planning</h4>
                            <p className="text-sm text-gray-600">Explore various project directions while keeping the main planning thread intact.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
