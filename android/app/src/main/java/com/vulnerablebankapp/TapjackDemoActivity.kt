package com.vulnerablebankapp

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
 * Because VulnBank lacks `filterTouchesWhenObscured="true"`, background touches register.
 *
 * Demo command:
 *   adb shell am start -n com.vulnerablebankapp.wear/com.vulnerablebankapp.TapjackDemoActivity
 */
class TapjackDemoActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(0xCC111111.toInt()) // 80% translucent dark overlay
            setPadding(40, 40, 40, 40)
        }

        val title = TextView(this).apply {
            text = "⚠️ TAPJACKING SIMULATION"
            setTextColor(Color.parseColor("#FFB020"))
            textSize = 14f
            gravity = Gravity.CENTER
        }

        val desc = TextView(this).apply {
            text = "Fake Overlay: 'Battery Saver Active'. Tap below to dismiss. Touch passes through to banking app."
            setTextColor(Color.WHITE)
            textSize = 11f
            gravity = Gravity.CENTER
            setPadding(0, 16, 0, 24)
        }

        val btn = Button(this).apply {
            text = "DISMISS (TAP HERE)"
            setBackgroundColor(Color.parseColor("#00E599"))
            setTextColor(Color.BLACK)
            setOnClickListener {
                Toast.makeText(
                    this@TapjackDemoActivity,
                    "⚠️ Tap intercepted! On vulnerable views, this authorizes background transfers.",
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

