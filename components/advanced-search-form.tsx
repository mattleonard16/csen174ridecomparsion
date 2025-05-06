"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Slider } from "./ui/slider"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

export default function AdvancedSearchForm({ onSubmit }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [priceImportance, setPriceImportance] = useState(5)
  const [timeImportance, setTimeImportance] = useState(5)
  const [comfortImportance, setComfortImportance] = useState(3)
  const [preferEco, setPreferEco] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [preferences, setPreferences] = useState("")

  const handleGeneratePreferences = () => {
    setIsGenerating(true)
    try {
      // Generate preferences using our template-based system
      setPreferences(generatePreferences())
    } catch (error) {
      console.error("Error generating preferences:", error)
      setPreferences("Unable to generate preferences at this time.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Template-based preference generation
  function generatePreferences() {
    const priceText =
      priceImportance > 7
        ? "I prioritize finding the most affordable ride option."
        : priceImportance > 4
          ? "I care about reasonable pricing."
          : "Price is less important to me than other factors."

    const timeText =
      timeImportance > 7
        ? "Quick pickup times are essential for me."
        : timeImportance > 4
          ? "I prefer not to wait too long for my ride."
          : "I'm willing to wait a bit longer if necessary."

    const comfortText = comfortImportance > 7 ? "I value comfort and a pleasant ride experience." : ""

    const ecoText = preferEco ? "I prefer eco-friendly transportation options when available." : ""

    return `${priceText} ${timeText} ${comfortText} ${ecoText}`.trim()
  }

  return (
    <div className="mt-4">
      <Button variant="outline" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full">
        {isAdvancedOpen ? "Hide Advanced Options" : "Show Advanced Options"}
      </Button>

      {isAdvancedOpen && (
        <Card className="p-4 mt-4 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Price Importance</Label>
              <span className="text-sm font-medium">{priceImportance}/10</span>
            </div>
            <Slider
              value={[priceImportance]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => setPriceImportance(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Time Importance</Label>
              <span className="text-sm font-medium">{timeImportance}/10</span>
            </div>
            <Slider
              value={[timeImportance]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => setTimeImportance(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Comfort Importance</Label>
              <span className="text-sm font-medium">{comfortImportance}/10</span>
            </div>
            <Slider
              value={[comfortImportance]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => setComfortImportance(value[0])}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="eco-mode" checked={preferEco} onCheckedChange={setPreferEco} />
            <Label htmlFor="eco-mode">Prefer eco-friendly options</Label>
          </div>

          <Button onClick={handleGeneratePreferences} disabled={isGenerating} variant="secondary" className="w-full">
            {isGenerating ? "Generating..." : "Generate Preferences Summary"}
          </Button>

          {preferences && <div className="bg-gray-100 p-3 rounded-md italic text-gray-700">"{preferences}"</div>}
        </Card>
      )}
    </div>
  )
}
