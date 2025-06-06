"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Archive,
  ArrowRight,
  BarChart3,
  Rocket,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Balancer } from "react-wrap-balancer";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* Section 1: Our Mission */}
      <section className="text-center mb-16 md:mb-24">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          <Balancer>What is JEEForces?</Balancer>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          <Balancer>
            JEEForces is a competitive platform designed from the ground up for
            JEE aspirants. We bridge the gap between traditional preparation and
            the thrilling, skill-honing world of competitive programming, creating
            an environment where you can learn, compete, and conquer.
          </Balancer>
        </p>
      </section>

      {/* Section 2: How It Works - The Contest Experience */}
      <section className="mb-16 md:mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            The Contest Experience
          </h2>
          <p className="mt-2 text-md md:text-lg text-muted-foreground">
            Our contests are engineered to simulate the pressure and pattern of the real exam, but with a competitive twist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: The Arena */}
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200">
            <CardHeader>
              <Trophy className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>The Arena</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Participate in regularly scheduled, time-bound contests. It's you against the clock and thousands of other aspirants.
            </CardContent>
          </Card>
          
          {/* Card 2: The Challenge */}
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200">
            <CardHeader>
              <Target className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>The Challenge</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Face a balanced set of problems across Physics, Chemistry, and Math. Problems range from NCERT level to JEE Advanced and even Olympiad difficulty.
            </CardContent>
          </Card>
          
          {/* Card 3: The Scoring */}
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200">
            <CardHeader>
              <BarChart3 className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>The Scoring & Ranking</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Harder problems grant more points. Your final rank is based on your total score. If scores are tied, the one who solved faster ranks higher.
            </CardContent>
          </Card>
          
          {/* Card 4: The Rating */}
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200">
            <CardHeader>
              <Star className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>The Rating</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Just like Codeforces, your performance in contests adjusts your unique rating. Climb the ranks and earn your title, from Newbie to Grandmaster.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: More Than Just Contests */}
      <section className="mb-16 md:mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            More Than Just Contests
          </h2>
          <p className="mt-2 text-md md:text-lg text-muted-foreground">
            Learning continues long after the timer stops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Problem Archive */}
          <Card className="flex flex-col sm:flex-row items-center p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200">
            <Archive className="h-12 w-12 text-primary mb-4 sm:mb-0 sm:mr-6 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Problem Archive</h3>
              <p className="text-muted-foreground">
                Missed a contest or want to retry a tough problem? Our vast problemset contains every question from past contests, available for you to practice anytime.
              </p>
            </div>
          </Card>
          
          {/* Card 2: Community Hub */}
          <Card className="flex flex-col sm:flex-row items-center p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200">
            <Users className="h-12 w-12 text-primary mb-4 sm:mb-0 sm:mr-6 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Community Hub</h3>
              <p className="text-muted-foreground">
                Learning is a community sport. Our discussion forums are the perfect place to ask doubts, share strategies, and learn from the solutions of top-ranked peers.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Section 4: Call to Action */}
      <section className="text-center bg-card border rounded-lg p-8 md:p-12">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Test Your Mettle?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of students who are sharpening their skills, tracking their progress, and building the confidence to ace the JEE.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contests">
            <Button size="lg" className="w-full sm:w-auto">
              <Rocket className="mr-2 h-5 w-5" />
              Explore Contests
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Join for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}