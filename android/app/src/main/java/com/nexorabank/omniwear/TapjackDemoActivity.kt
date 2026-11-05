package com.nexorabank.omniwear

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

/**
 * V-W08: Wear OS Tapjacking / Overlay Demonstration Activity.
 *
 * INTENTIONALLY VULNERABLE:
 * Demonstrates how an obscured or translucent window can bait a smartwatch user into
 * tapping an action that passes through or tricks the user on a 480x480 circular screen.
 */
class TapjackDemoActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(0xCC080A0F.toInt()) // 80% translucent Obsidian overlay
            setPadding(40, 40, 40, 40)
        }

        val title = TextView(this).apply {
            text = "⚡ SYSTEM OPTIMIZATION"
            setTextColor(Color.parseColor("#F5C542")) // Nexora Gold
            textSize = 14f
            gravity = Gravity.CENTER
        }

        val desc = TextView(this).apply {
            text = "AMOLED Battery Saver Active. Tap below to dismiss. Touch passes through to banking view."
            setTextColor(Color.WHITE)
            textSize = 11f
            gravity = Gravity.CENTER
            setPadding(0, 16, 0, 24)
        }

        val btn = Button(this).apply {
            text = "DISMISS (TAP HERE)"
            setBackgroundColor(Color.parseColor("#00E599")) // Nexora Emerald
            setTextColor(Color.BLACK)
            setOnClickListener {
                Toast.makeText(
                    this@TapjackDemoActivity,
                    "⚠️ [V-W08 Tapjack] Tap intercepted! Pass-through authorizes background wire transfer.",
                    Toast.LENGTH_LONG
                ).show()
                finish()
            }
        }

        layout.addView(title)
        layout.addView(desc)
        layout.addView(btn)

        setContentView(layout)
    }
}

