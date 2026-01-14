-- SQL Function for Build Schedule
-- Execute this in your Supabase SQL Editor to create the function

CREATE OR REPLACE FUNCTION get_build_schedule(
  d_from DATE,
  d_to DATE,
  hide_built BOOLEAN DEFAULT FALSE,
  brightview_filter BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  vin_num TEXT,
  stock_num TEXT,
  order_num TEXT,
  asset_no INTEGER,
  model TEXT,
  color TEXT,
  build_date DATE,
  options JSONB,
  custom_options JSONB,
  dealer TEXT,
  size TEXT,
  shipment TEXT,
  sequ TEXT,
  build_notes TEXT,
  vin_sticker TEXT,
  brightview BOOLEAN,
  fin_date DATE,
  height TEXT,
  beavertail BOOLEAN,
  model_id INTEGER,
  dealer_id INTEGER,
  status TEXT,
  status_value INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH
  params AS (
    SELECT
      d_from AS d_from,
      d_to AS d_to,
      hide_built AS hide_built,
      brightview_filter AS brightview_filter
  ),

  /* 1) restrict the universe first */
  scheduled_ids AS (
    SELECT o.id
    FROM "order" o, params p
    WHERE o.build_date IS NOT NULL
      AND o.build_date::date BETWEEN p.d_from AND p.d_to
  ),
  unscheduled_ids AS (
    SELECT o.id
    FROM "order" o
    WHERE o.build_date IS NULL
  ),

  /* 2) compute status only for relevant orders */
  unfinished_schedules AS (
    SELECT s.order_id, s.status, s.status_value
    FROM schedule s
    WHERE s.finished = false
      AND s.status != 'ready to ship'
      AND s.order_id IN (
        SELECT id FROM scheduled_ids
        UNION
        SELECT id FROM unscheduled_ids
      )
  ),
  last_finished AS (
    SELECT t.order_id, t.status, t.status_value
    FROM (
      SELECT
        s.order_id, s.status, s.status_value,
        ROW_NUMBER() OVER (PARTITION BY s.order_id ORDER BY s.status_value DESC) AS rn
      FROM schedule s
      WHERE s.finished = true
        AND s.order_id IN (
          SELECT id FROM scheduled_ids
          UNION
          SELECT id FROM unscheduled_ids
        )
    ) t
    WHERE t.rn = 1
  ),
  shipped_fallback AS (
    SELECT o.id AS order_id, 'SHIPPED' AS status, NULL::int AS status_value
    FROM "order" o
    WHERE o.id IN (
      SELECT id FROM scheduled_ids
      UNION
      SELECT id FROM unscheduled_ids
    )
      AND NOT EXISTS (
        SELECT 1 FROM unfinished_schedules us WHERE us.order_id = o.id
      )
  ),
  final_schedules AS (
    SELECT order_id, status, status_value, 1 AS prio FROM shipped_fallback
    UNION ALL
    SELECT order_id, status, status_value, 2 AS prio FROM last_finished
  ),

  model_incomplete AS (
    SELECT 
      o.id, o.vin_num, o.stock_num, o.order_num, o.asset_no,
      o.dealer_id, o.model AS model_id, o.build_date, o."options", o.custom_options,
      m."label" AS model, c."label" AS color, n.size, o.sequ, o.shipment_id,
      o.build_notes, o.vin_sticker, o.brightview, o.fin_date, o.height, o.beavertail
    FROM "order" o
    LEFT JOIN div_frontend_options m ON CAST(o.model AS VARCHAR) = m.value AND m.type = 'Model'
    LEFT JOIN div_frontend_options c ON CAST(o.color AS VARCHAR) = c.value AND c.type = 'Color'
    LEFT JOIN model n ON CAST(o.model AS INT) = n.name
    WHERE o.id IN (
      SELECT id FROM scheduled_ids
      UNION
      SELECT id FROM unscheduled_ids
    )
  ),

  with_status AS (
    SELECT
      x.*,
      fs.status,
      fs.status_value
    FROM model_incomplete x
    LEFT JOIN LATERAL (
      SELECT status, status_value
      FROM (
        SELECT DISTINCT ON (order_id) order_id, status, status_value, prio
        FROM final_schedules
        WHERE order_id = x.id
        ORDER BY order_id, prio
      ) t
    ) fs ON TRUE
  )

  SELECT
    x.id, x.vin_num, x.stock_num, x.order_num, x.asset_no,
    x.model, x.color, x.build_date, x.options, x.custom_options,
    d.name AS dealer, f.label AS size, s.label AS shipment,
    x.sequ, x.build_notes, x.vin_sticker, x.brightview, x.fin_date,
    x.height, x.beavertail, x.model_id, x.dealer_id,
    x.status, x.status_value
  FROM with_status x
  LEFT JOIN div_frontend_options f ON CAST(x.size AS VARCHAR) = f.value AND f.type = 'Size'
  LEFT JOIN dealer d ON x.dealer_id = d.id
  LEFT JOIN shipment s ON x.shipment_id = s.id
  JOIN params p ON TRUE
  WHERE
    (
      (
        x.build_date IS NOT NULL
        AND (NOT p.hide_built OR UPPER(x.status) NOT IN ('READY TO SHIP','SHIPPED'))
      )
      OR
      (
        x.build_date IS NULL
        AND UPPER(x.status) <> 'SHIPPED'
      )
    )
    AND
    (
      p.brightview_filter IS NULL
      OR (p.brightview_filter = true AND x.brightview = true)
      OR (p.brightview_filter = false AND (x.brightview = false OR x.brightview IS NULL))
    )
  ORDER BY x.build_date, x.sequ, x.color;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_build_schedule(DATE, DATE, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_build_schedule(DATE, DATE, BOOLEAN, BOOLEAN) TO anon;

